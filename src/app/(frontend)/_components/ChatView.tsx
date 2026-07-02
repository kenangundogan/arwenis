'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { Typewriter } from 'eglador-ui-react-typewriter'
import { useTranslations } from 'next-intl'
import { useChatStream } from '../_hooks/useChatStream'
import { getMessages } from '../_lib/api'
import MessageList from './MessageList'
import Composer from './Composer'

interface Props {
    conversationId?: string
    welcome: string
    suggestions: string[]
    userName?: string
    maxMessageChars?: number
}

export default function ChatView({ conversationId, welcome, suggestions, userName, maxMessageChars }: Props) {
    const t = useTranslations()
    const [greeting, setGreeting] = useState('')
    const [today, setToday] = useState('')

    useEffect(() => {
        const h = new Date().getHours()
        const g =
            h < 6 || h >= 22
                ? t('chat.greetingNight')
                : h < 12
                  ? t('chat.greetingMorning')
                  : h < 18
                    ? t('chat.greetingDay')
                    : t('chat.greetingEvening')
        setGreeting(userName ? t('chat.greetingWithName', { greeting: g, name: userName }) : g)
        setToday(t('chat.todayIs', { date: new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }) }))
    }, [userName, t])
    const onConversationCreated = useCallback((id: string) => {
        window.history.replaceState(null, '', `/chat/${id}`)
        window.dispatchEvent(new CustomEvent('arwenis:conversations-changed'))
    }, [])
    const { messages, streaming, send, stop, regenerate, switchVariant, setHistory, messagesRef, streamingRef } = useChatStream({
        initialConversationId: conversationId,
        onConversationCreated,
    })

    useEffect(() => {
        if (!conversationId) return
        let active = true
        getMessages(conversationId).then((docs) => {
            if (!active) return
            if (streamingRef.current || messagesRef.current.length > 0) return
            setHistory(
                docs.map((d) => {
                    const variants =
                        d.variants && d.variants.length > 0
                            ? d.variants.map((v) => ({ content: v.content, citations: v.citations ?? undefined }))
                            : undefined
                    const idx = variants ? (d.activeVariant ?? variants.length - 1) : 0
                    const active = variants?.[idx]
                    return {
                        id: d.id,
                        role: d.role,
                        content: active ? active.content : d.content,
                        citations: active ? active.citations : (d.citations ?? undefined),
                        variants,
                        activeVariant: variants ? idx : undefined,
                        feedback: d.feedback ?? undefined,
                    }
                }),
            )
        })
        return () => {
            active = false
        }
    }, [conversationId, setHistory, messagesRef, streamingRef])

    const scrollRef = useRef<HTMLDivElement>(null)
    const stick = useRef(true)
    const [atBottom, setAtBottom] = useState(true)

    const onScroll = () => {
        const el = scrollRef.current
        if (!el) return
        const near = el.scrollHeight - el.scrollTop - el.clientHeight < 120
        stick.current = near
        setAtBottom(near)
    }

    const scrollToBottom = () => {
        const el = scrollRef.current
        if (!el) return
        stick.current = true
        el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
    }

    useEffect(() => {
        const el = scrollRef.current
        if (el && stick.current) el.scrollTop = el.scrollHeight
    }, [messages])

    useEffect(() => {
        stick.current = true
    }, [conversationId])

    const handleSend = (text: string) => {
        stick.current = true
        send(text)
    }

    const empty = messages.length === 0

    return (
        <div className="flex h-full flex-col">
            <div ref={scrollRef} onScroll={onScroll} className="flex-1 overflow-y-auto">
                {empty ? (
                    <div className="mx-auto flex h-full max-w-2xl flex-col items-center justify-center gap-6 px-4 text-center">
                        <div className="space-y-1.5">
                            {greeting && <h1 className="text-2xl font-semibold text-zinc-900">{greeting}</h1>}
                            {today && <p className="text-sm text-zinc-400">{today}</p>}
                            <p className="text-base text-zinc-500">
                                <Typewriter hideCursorWhenDone>{welcome}</Typewriter>
                            </p>
                        </div>
                        {suggestions.length > 0 && (
                            <div className="flex flex-wrap justify-center gap-2">
                                {suggestions.map((q, i) => (
                                    <button
                                        key={i}
                                        onClick={() => handleSend(q)}
                                        className="rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-700 transition hover:border-zinc-300 hover:text-zinc-900"
                                    >
                                        {q}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <MessageList
                        messages={messages}
                        onRegenerate={streaming ? undefined : regenerate}
                        onSwitchVariant={streaming ? undefined : switchVariant}
                    />
                )}
            </div>
            <div className="relative">
                {!empty && !atBottom && (
                    <button
                        type="button"
                        onClick={scrollToBottom}
                        aria-label={t('chat.scrollToBottom')}
                        className="absolute bottom-full left-1/2 z-10 mb-3 flex size-9 -translate-x-1/2 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-700 shadow-md transition hover:bg-zinc-50 hover:text-zinc-900"
                    >
                        <ChevronDown className="size-5" />
                    </button>
                )}
                <Composer onSend={handleSend} onStop={stop} streaming={streaming} maxLength={maxMessageChars} />
            </div>
        </div>
    )
}
