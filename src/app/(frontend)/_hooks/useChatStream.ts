'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'eglador-ui-react-toast'
import { setActiveVariant } from '../_lib/api'
import { readSSE, type Citation } from '../_lib/sse'

export interface MessageVariant {
    content: string
    citations?: Citation[]
}

export interface ChatMessage {
    id?: string
    localId?: string
    role: 'user' | 'assistant'
    content: string
    citations?: Citation[]
    variants?: MessageVariant[]
    activeVariant?: number
    pending?: boolean
}

interface Options {
    initialConversationId?: string
    onConversationCreated?: (id: string) => void
}

const updateLastAssistant = (
    msgs: ChatMessage[],
    fn: (a: ChatMessage) => ChatMessage,
): ChatMessage[] => {
    const i = msgs.length - 1
    if (i < 0 || msgs[i].role !== 'assistant') return msgs
    const copy = msgs.slice()
    copy[i] = fn(copy[i])
    return copy
}

export function useChatStream({ initialConversationId, onConversationCreated }: Options) {
    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [streaming, setStreaming] = useState(false)
    const conversationIdRef = useRef<string | undefined>(initialConversationId)
    const abortRef = useRef<AbortController | null>(null)
    const localIdRef = useRef(0)
    const messagesRef = useRef<ChatMessage[]>([])

    useEffect(() => {
        messagesRef.current = messages
    }, [messages])

    const setHistory = useCallback((msgs: ChatMessage[]) => {
        setMessages(msgs.map((m) => ({ ...m, localId: m.localId ?? m.id ?? `m${++localIdRef.current}` })))
    }, [])

    const stop = useCallback(() => abortRef.current?.abort(), [])

    const runStream = useCallback(
        async (body: Record<string, unknown>) => {
            const ac = new AbortController()
            abortRef.current = ac
            try {
                const res = await fetch('/api/assistant/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body),
                    signal: ac.signal,
                })
                if (!res.ok) {
                    const b = await res.json().catch(() => null)
                    throw new Error(b?.errors?.[0]?.message || b?.message || 'Mesaj gönderilemedi.')
                }
                if (!res.body) throw new Error('Yanıt alınamadı.')

                await readSSE(res, (e) => {
                    if (e.type === 'conversation') {
                        if (!conversationIdRef.current) {
                            conversationIdRef.current = e.id
                            onConversationCreated?.(e.id)
                        }
                    } else if (e.type === 'text') {
                        setMessages((m) => updateLastAssistant(m, (a) => ({ ...a, content: a.content + e.text })))
                    } else if (e.type === 'citations') {
                        setMessages((m) => updateLastAssistant(m, (a) => ({ ...a, citations: e.citations })))
                    } else if (e.type === 'done') {
                        if (e.messageId) setMessages((m) => updateLastAssistant(m, (a) => ({ ...a, id: e.messageId })))
                    } else if (e.type === 'error') {
                        setMessages((m) => updateLastAssistant(m, (a) => ({ ...a, content: a.content || e.message })))
                    }
                })
            } catch (err) {
                if (!ac.signal.aborted) {
                    toast.error((err as Error)?.message || 'Mesaj gönderilemedi.')
                }
            } finally {
                setMessages((m) => {
                    const i = m.length - 1
                    if (i >= 0 && m[i].role === 'assistant' && !m[i].content && !m[i].variants) {
                        return m.slice(0, i)
                    }
                    return updateLastAssistant(m, (a) => {
                        if (!a.variants || a.activeVariant == null) return { ...a, pending: false }
                        if (!a.content) {
                            const kept = a.variants.slice(0, -1)
                            const prev = kept.length - 1
                            return kept.length > 1
                                ? { ...a, pending: false, variants: kept, activeVariant: prev, content: kept[prev].content, citations: kept[prev].citations }
                                : { ...a, pending: false, variants: undefined, activeVariant: undefined, content: kept[0]?.content ?? a.content, citations: kept[0]?.citations }
                        }
                        const v = a.variants.slice()
                        v[a.activeVariant] = { content: a.content, citations: a.citations }
                        return { ...a, pending: false, variants: v }
                    })
                })
                setStreaming(false)
                abortRef.current = null
            }
        },
        [onConversationCreated],
    )

    const send = useCallback(
        (text: string) => {
            const content = text.trim()
            if (!content || streaming) return
            setStreaming(true)
            setMessages((m) => [
                ...m,
                { localId: `m${++localIdRef.current}`, role: 'user', content },
                { localId: `m${++localIdRef.current}`, role: 'assistant', content: '', pending: true },
            ])
            runStream({ message: content, conversationId: conversationIdRef.current })
        },
        [streaming, runStream],
    )

    const regenerate = useCallback(() => {
        if (streaming) return
        const convId = conversationIdRef.current
        const cur = messagesRef.current
        const i = cur.length - 1
        if (!convId || i < 0 || cur[i].role !== 'assistant') return
        setStreaming(true)
        setMessages((m) => {
            const j = m.length - 1
            if (j < 0 || m[j].role !== 'assistant') return m
            const msg = m[j]
            const seeded =
                msg.variants && msg.variants.length > 0
                    ? msg.variants
                    : [{ content: msg.content, citations: msg.citations }]
            const variants = [...seeded, { content: '', citations: undefined }]
            const copy = m.slice()
            copy[j] = {
                ...msg,
                content: '',
                citations: undefined,
                id: undefined,
                pending: true,
                variants,
                activeVariant: variants.length - 1,
            }
            return copy
        })
        runStream({ regenerate: true, conversationId: convId })
    }, [streaming, runStream])

    const switchVariant = useCallback(
        (localId: string, dir: 1 | -1) => {
            if (streaming) return
            const msg = messagesRef.current.find((m) => m.localId === localId)
            if (!msg || msg.role !== 'assistant') return
            const variants = msg.variants
            if (!variants || variants.length < 2) return
            const active = msg.activeVariant ?? variants.length - 1
            const nextIdx = active + dir
            if (nextIdx < 0 || nextIdx >= variants.length) return
            setMessages((m) =>
                m.map((a) =>
                    a.localId === localId
                        ? {
                              ...a,
                              activeVariant: nextIdx,
                              content: variants[nextIdx].content,
                              citations: variants[nextIdx].citations,
                          }
                        : a,
                ),
            )
            if (msg.id) setActiveVariant(msg.id, nextIdx)
        },
        [streaming],
    )

    return { messages, streaming, send, stop, regenerate, switchVariant, setHistory, conversationIdRef }
}
