import type { Payload } from 'payload'
import type { Conversation } from '@/payload-types'
import type { AssistantConfig } from './loadConfig'
import type { ChatMessage } from './types'
import type { UsedCitation } from './guardrails'
import { resolveLLM } from './config'
import { getLLMAdapter, collectText } from './llm'

const relId = (v: unknown): string | undefined =>
    typeof v === 'string' ? v : v && typeof v === 'object' && 'id' in v ? String((v as { id: unknown }).id) : undefined

export const getOrCreateConversation = async (
    payload: Payload,
    memberId: string,
    conversationId?: string,
): Promise<Conversation> => {
    if (conversationId) {
        try {
            const conv = await payload.findByID({
                collection: 'conversations',
                id: conversationId,
                depth: 0,
                overrideAccess: true,
            })
            if (conv && !conv.deletedAt && relId(conv.member) === memberId) return conv
        } catch (err) {
            payload.logger.error({ err }, '[assistant] conversation lookup failed')
        }
    }
    return payload.create({
        collection: 'conversations',
        data: { member: memberId, status: 'active', messageCount: 0, tokensTotal: 0 },
        overrideAccess: true,
    })
}

export const countConversations = async (payload: Payload, memberId: string): Promise<number> => {
    const res = await payload.find({
        collection: 'conversations',
        where: { and: [{ member: { equals: memberId } }, { deletedAt: { exists: false } }] },
        limit: 1,
        depth: 0,
        overrideAccess: true,
    })
    return res.totalDocs
}

export const loadHistory = async (
    payload: Payload,
    conversationId: string,
    windowSize: number,
): Promise<ChatMessage[]> => {
    if (windowSize <= 0) return []
    const res = await payload.find({
        collection: 'messages',
        where: { conversation: { equals: conversationId } },
        sort: '-createdAt',
        limit: windowSize,
        depth: 0,
        overrideAccess: true,
    })
    return res.docs
        .map((m) => ({ role: m.role as ChatMessage['role'], content: m.content }))
        .reverse()
}

export const persistTurn = async (
    payload: Payload,
    args: {
        conv: Conversation
        userText: string
        assistantText: string
        citations: UsedCitation[]
        tokensIn?: number
        tokensOut?: number
    },
): Promise<string | undefined> => {
    const { conv } = args
    const member = relId(conv.member)

    await payload.create({
        collection: 'messages',
        data: { conversation: conv.id, member, role: 'user', content: args.userText },
        overrideAccess: true,
    })
    const assistant = await payload.create({
        collection: 'messages',
        data: {
            conversation: conv.id,
            member,
            role: 'assistant',
            content: args.assistantText || '(boş yanıt)',
            citations: args.citations.length ? args.citations : undefined,
            tokensIn: args.tokensIn,
            tokensOut: args.tokensOut,
        },
        overrideAccess: true,
    })

    await payload.update({
        collection: 'conversations',
        id: conv.id,
        data: {
            messageCount: (conv.messageCount ?? 0) + 2,
            tokensTotal: (conv.tokensTotal ?? 0) + (args.tokensIn ?? 0) + (args.tokensOut ?? 0),
            lastMessageAt: new Date().toISOString(),
        },
        overrideAccess: true,
    })

    return String(assistant.id)
}

const MEMORY_CAP = 100

export const loadMemories = async (
    payload: Payload,
    memberId: string,
    limit = MEMORY_CAP,
): Promise<{ id: string; text: string }[]> => {
    const res = await payload.find({
        collection: 'memory',
        where: { member: { equals: memberId } },
        sort: '-createdAt',
        limit,
        depth: 0,
        overrideAccess: true,
    })
    return res.docs.map((d) => ({ id: String(d.id), text: d.text }))
}

export const saveMemories = async (payload: Payload, memberId: string, newFacts: string[]): Promise<number> => {
    if (!newFacts.length) return 0
    const existing = await loadMemories(payload, memberId)
    if (existing.length >= MEMORY_CAP) return 0

    const seen = existing.map((e) => e.text.toLowerCase())
    let created = 0
    for (const fact of newFacts) {
        if (existing.length + created >= MEMORY_CAP) break
        const norm = fact.toLowerCase()
        const dup = seen.some((e) => e === norm || e.includes(norm) || norm.includes(e))
        if (dup) continue
        await payload.create({
            collection: 'memory',
            data: { member: memberId, text: fact.slice(0, 500) },
            overrideAccess: true,
        })
        seen.push(norm)
        created++
    }
    return created
}

export const buildUserContext = (args: {
    name?: string | null
    facts: string[]
    priorSummary?: string | null
}): string => {
    const lines: string[] = []
    if (args.name) lines.push(`Kullanıcının adı: ${args.name}`)
    if (args.facts.length) lines.push('Kullanıcı hakkında hatırlananlar:\n' + args.facts.map((f) => `- ${f}`).join('\n'))
    if (args.priorSummary) lines.push('Önceki konuşma özeti:\n' + args.priorSummary)
    return lines.length ? `[Kullanıcı bağlamı]\n${lines.join('\n\n')}` : ''
}

export const generateTitle = async (
    payload: Payload,
    settings: AssistantConfig,
    conv: Conversation,
    firstUserText: string,
): Promise<void> => {
    const template = settings.prompts?.titlePrompt
    if (!template) return
    try {
        const llm = resolveLLM(settings)
        const { text } = await collectText(getLLMAdapter(llm.adapter), {
            baseUrl: llm.baseUrl,
            apiKey: llm.apiKey,
            model: llm.model,
            maxTokens: 24,
            temperature: 0.3,
            messages: [
                { role: 'system', content: template },
                { role: 'user', content: firstUserText },
            ],
        })
        const title = text.trim().replace(/^["'`]+|["'`]+$/g, '').slice(0, 80)
        if (title) {
            await payload.update({ collection: 'conversations', id: conv.id, data: { title }, overrideAccess: true })
        }
    } catch (err) {
        payload.logger.error({ err }, '[assistant] title generation failed')
    }
}
