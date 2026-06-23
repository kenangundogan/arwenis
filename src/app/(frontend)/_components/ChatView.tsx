'use client'

import { useEffect, useState } from 'react'
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
}

export default function ChatView({ conversationId, welcome, suggestions, userName }: Props) {
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
    const { messages, streaming, send, stop, setHistory } = useChatStream({
        initialConversationId: conversationId,
        onConversationCreated: (id) => {
            window.history.replaceState(null, '', `/chat/${id}`)
            window.dispatchEvent(new CustomEvent('arwenis:conversations-changed'))
        },
    })

    useEffect(() => {
        if (!conversationId) return
        let active = true
        getMessages(conversationId).then((docs) => {
            if (!active) return
            setHistory(
                docs.map((d) => ({
                    id: d.id,
                    role: d.role,
                    content: d.content,
                    citations: d.citations ?? undefined,
                })),
            )
        })
        return () => {
            active = false
        }
    }, [conversationId, setHistory])

    const empty = messages.length === 0

    return (
        <div className="flex h-full flex-col">
            <div className="flex-1 overflow-y-auto">
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
                                        onClick={() => send(q)}
                                        className="rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-700 transition hover:border-zinc-300 hover:text-zinc-900"
                                    >
                                        {q}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <MessageList messages={messages} />
                )}
            </div>
            <Composer onSend={send} onStop={stop} streaming={streaming} />
        </div>
    )
}
