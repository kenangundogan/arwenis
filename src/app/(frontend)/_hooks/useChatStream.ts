'use client'

import { useCallback, useRef, useState } from 'react'
import { toast } from 'eglador-ui-react-toast'
import { readSSE, type Citation } from '../_lib/sse'

export interface ChatMessage {
    id?: string
    role: 'user' | 'assistant'
    content: string
    citations?: Citation[]
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

    const setHistory = useCallback((msgs: ChatMessage[]) => setMessages(msgs), [])

    const stop = useCallback(() => abortRef.current?.abort(), [])

    const send = useCallback(
        async (text: string) => {
            const content = text.trim()
            if (!content || streaming) return
            setStreaming(true)
            setMessages((m) => [
                ...m,
                { role: 'user', content },
                { role: 'assistant', content: '', pending: true },
            ])

            const ac = new AbortController()
            abortRef.current = ac
            try {
                const res = await fetch('/api/assistant/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: content, conversationId: conversationIdRef.current }),
                    signal: ac.signal,
                })
                if (!res.ok) {
                    const body = await res.json().catch(() => null)
                    throw new Error(body?.errors?.[0]?.message || body?.message || 'Mesaj gönderilemedi.')
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
                    if (i >= 0 && m[i].role === 'assistant' && !m[i].content) {
                        return m.slice(0, i)
                    }
                    return updateLastAssistant(m, (a) => ({ ...a, pending: false }))
                })
                setStreaming(false)
                abortRef.current = null
            }
        },
        [streaming, onConversationCreated],
    )

    return { messages, streaming, send, stop, setHistory, conversationIdRef }
}
