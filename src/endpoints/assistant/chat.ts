import type { Endpoint } from 'payload'
import { APIError } from 'payload'

import type { ChatMessage, Citation } from '@/lib/assistant/types'
import { resolveLLM } from '@/lib/assistant/config'
import { loadAssistantConfig } from '@/lib/assistant/loadConfig'
import { getLLMAdapter } from '@/lib/assistant/llm'
import { planQuery, retrieve } from '@/lib/assistant/retrieve'
import { buildContext } from '@/lib/assistant/buildContext'
import { extractUsedCitations, type UsedCitation } from '@/lib/assistant/guardrails'
import { resolveMember } from '@/lib/assistant/auth/resolveMember'
import { assertSameOrigin } from '@/lib/assistant/auth/csrf'
import {
    getOrCreateConversation,
    loadHistory,
    persistTurn,
    generateTitle,
    loadMemories,
    saveMemories,
    buildUserContext,
    countConversations,
} from '@/lib/assistant/store'
import { summarizeAndExtract } from '@/lib/assistant/summarize'
import { checkDailyCap, incrementUsage, estimateTokens } from '@/lib/assistant/usage'
import { checkRateLimit, getClientIp } from '@/lib/assistant/rateLimit'

const MESSAGE_CHAR_CAP = 4000
const HISTORY_CHAR_CAP = 8000
const MEMBER_HOURLY_CAP = 100

const sanitizeHistory = (raw: unknown, windowSize: number): ChatMessage[] => {
    if (!Array.isArray(raw)) return []
    const cleaned: ChatMessage[] = raw
        .filter(
            (m): m is ChatMessage =>
                !!m &&
                typeof m === 'object' &&
                ((m as ChatMessage).role === 'user' || (m as ChatMessage).role === 'assistant') &&
                typeof (m as ChatMessage).content === 'string' &&
                (m as ChatMessage).content.trim().length > 0,
        )
        .map((m) => ({ role: m.role, content: String(m.content).slice(0, HISTORY_CHAR_CAP) }))
    return windowSize > 0 ? cleaned.slice(-windowSize) : cleaned
}

export const chatEndpoint: Endpoint = {
    path: '/assistant/chat',
    method: 'post',
    handler: async (req) => {
        assertSameOrigin(req)
        let body: { message?: string; conversationId?: string; history?: unknown }
        try {
            body = (await req.json?.()) ?? {}
        } catch {
            throw new APIError('Geçersiz JSON gövdesi.', 400)
        }

        const message = (body.message ?? '').toString().trim().slice(0, MESSAGE_CHAR_CAP)
        if (!message) throw new APIError('`message` alanı gereklidir.', 400)

        const member = await resolveMember(req)
        if (!member) throw new APIError('Bu işlem için giriş yapmanız gerekir.', 401)
        const memberId = String(member.id)

        const settings = await loadAssistantConfig(req.payload)

        const rateLimit = settings.limits?.perIpRateLimit ?? 0
        if (rateLimit > 0 && !checkRateLimit(`chat:${getClientIp(req.headers)}`, rateLimit, 60_000)) {
            throw new APIError('Çok fazla istek gönderildi. Lütfen biraz bekleyin.', 429)
        }

        if (!checkRateLimit(`chat:member:${memberId}`, MEMBER_HOURLY_CAP, 60 * 60 * 1000)) {
            throw new APIError('Saatlik mesaj sınırına ulaştınız. Lütfen biraz sonra tekrar deneyin.', 429)
        }

        if (!(await checkDailyCap(req.payload, settings.limits?.dailyMessageCap))) {
            throw new APIError('Günlük mesaj sınırına ulaşıldı. Lütfen yarın tekrar deneyin.', 429)
        }

        const historyWindow = settings.memory?.historyWindow ?? 10
        const persistEnabled = !!member && settings.memory?.persistConversations !== false
        const requestedConvId = body.conversationId?.trim() || undefined

        if (persistEnabled && !requestedConvId) {
            const maxConvs = settings.limits?.maxConversationsPerUser ?? 0
            if (maxConvs > 0 && (await countConversations(req.payload, memberId)) >= maxConvs) {
                throw new APIError('En fazla konuşma sayısına ulaştınız. Lütfen eski bir konuşmayı silin.', 409)
            }
        }

        const conv = persistEnabled
            ? await getOrCreateConversation(req.payload, memberId, requestedConvId)
            : null

        if (persistEnabled && requestedConvId && conv) {
            const maxMsgs = settings.limits?.maxConversationMessages ?? 0
            if (maxMsgs > 0 && (conv.messageCount ?? 0) >= maxMsgs) {
                throw new APIError('Bu konuşma mesaj sınırına ulaştı. Lütfen yeni bir konuşma başlatın.', 409)
            }
        }

        const isFirstTurn = !!conv && (conv.messageCount ?? 0) === 0
        const history: ChatMessage[] = conv
            ? await loadHistory(req.payload, String(conv.id), historyWindow)
            : sanitizeHistory(body.history, historyWindow)

        const crossConv = settings.memory?.crossConversation !== false
        let userContext = ''
        if (conv && member) {
            const facts = crossConv ? (await loadMemories(req.payload, String(member.id))).map((m) => m.text) : []
            const memberName = [member.firstName, member.lastName].filter(Boolean).join(' ') || member.email
            userContext = buildUserContext({ name: memberName, facts, priorSummary: conv.summary })
        }

        const encoder = new TextEncoder()
        const abort = new AbortController()

        let full = ''
        let usage: { inputTokens?: number; outputTokens?: number } | undefined
        let citations: Citation[] = []
        let usedCitations: UsedCitation[] = []
        let finalized = false
        let assistantMessageId: string | undefined

        const finalize = async () => {
            if (finalized) return
            finalized = true
            try {
                if (persistEnabled && conv) {
                    assistantMessageId = await persistTurn(req.payload, {
                        conv,
                        userText: message,
                        assistantText: full,
                        citations: usedCitations,
                        tokensIn: usage?.inputTokens,
                        tokensOut: usage?.outputTokens,
                    })
                    if (isFirstTurn) await generateTitle(req.payload, settings, conv, message)
                }
            } catch (err) {
                req.payload.logger.error({ err }, '[assistant] persist failed')
            }
            const total = (usage?.inputTokens ?? 0) + (usage?.outputTokens ?? 0)
            await incrementUsage(req.payload, total > 0 ? total : estimateTokens(message) + estimateTokens(full))
        }

        const runMemory = async () => {
            if (!persistEnabled || !conv) return
            try {
                const turns: ChatMessage[] = [
                    ...history,
                    { role: 'user', content: message },
                    { role: 'assistant', content: full },
                ]
                const { summary, newFacts } = await summarizeAndExtract(settings, {
                    priorSummary: conv.summary,
                    turns,
                    extractFacts: crossConv,
                })
                if (summary) {
                    await req.payload.update({
                        collection: 'conversations',
                        id: conv.id,
                        data: { summary },
                        overrideAccess: true,
                    })
                }
                if (crossConv && newFacts.length && member) {
                    await saveMemories(req.payload, String(member.id), newFacts)
                }
            } catch (err) {
                req.payload.logger.error({ err }, '[assistant] memory update failed')
            }
        }

        const stream = new ReadableStream<Uint8Array>({
            async start(controller) {
                const send = (obj: unknown) => {
                    try {
                        controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`))
                    } catch {
                    }
                }

                try {
                    if (conv) send({ type: 'conversation', id: conv.id })

                    const plan = await planQuery(settings, history, message)
                    citations = await retrieve(settings, plan)

                    if (citations.length === 0 && !userContext) {

                        full = settings.prompts?.noContextReply || 'Bu konuda elimde bilgi yok.'
                        send({ type: 'text', text: full })
                    } else {
                        const messages = buildContext({
                            systemPromptTemplate: settings.prompts?.systemPrompt || '',
                            persona: settings.persona,
                            userContext,
                            citations,
                            history,
                            userMessage: message,
                        })
                        const llm = resolveLLM(settings)
                        const adapter = getLLMAdapter(llm.adapter)

                        for await (const ev of adapter({
                            baseUrl: llm.baseUrl,
                            apiKey: llm.apiKey,
                            model: llm.model,
                            maxTokens: llm.maxTokens,
                            temperature: llm.temperature,
                            messages,
                            signal: abort.signal,
                        })) {
                            if (ev.type === 'text') {
                                full += ev.text
                                send({ type: 'text', text: ev.text })
                            } else if (ev.type === 'usage') {
                                usage = { inputTokens: ev.inputTokens, outputTokens: ev.outputTokens }
                            } else if (ev.type === 'error') {
                                send({ type: 'error', message: ev.message })
                                if (full) {
                                    usedCitations = extractUsedCitations(full, citations)
                                    await finalize()
                                }
                                controller.close()
                                return
                            } else if (ev.type === 'done') {
                                break
                            }
                        }
                        usedCitations = extractUsedCitations(full, citations)
                        send({ type: 'citations', citations: usedCitations })
                    }

                    await finalize()
                    send({ type: 'done', usage, messageId: assistantMessageId })
                    await runMemory()
                    controller.close()
                } catch (err) {
                    if (abort.signal.aborted) {

                        usedCitations = extractUsedCitations(full, citations)
                        try {
                            await finalize()
                        } catch {
                        }
                    } else {
                        send({ type: 'error', message: (err as Error).message })
                    }
                    try {
                        controller.close()
                    } catch {
                    }
                }
            },
            cancel() {
                abort.abort()
            },
        })

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/event-stream; charset=utf-8',
                'Cache-Control': 'no-cache, no-transform',
                'X-Accel-Buffering': 'no',
                Connection: 'keep-alive',
            },
        })
    },
}
