'use client'

import React, { useRef, useState } from 'react'
import { Button } from 'eglador-ui-react'
import { Send, Square } from 'lucide-react'
import { useTranslations } from 'next-intl'

interface Props {
    onSend: (text: string) => void
    onStop: () => void
    streaming: boolean
}

export default function Composer({ onSend, onStop, streaming }: Props) {
    const t = useTranslations()
    const [text, setText] = useState('')
    const ref = useRef<HTMLTextAreaElement>(null)

    const resize = () => {
        const el = ref.current
        if (!el) return
        el.style.height = 'auto'
        el.style.height = `${Math.min(el.scrollHeight, 200)}px`
    }

    const submit = () => {
        const trimmed = text.trim()
        if (!trimmed || streaming) return
        onSend(trimmed)
        setText('')
        if (ref.current) ref.current.style.height = 'auto'
    }

    const onKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            submit()
        }
    }

    return (
        <div className="border-t border-zinc-200 bg-zinc-50 px-4 py-3">
            <div className="mx-auto flex max-w-3xl items-end gap-2 rounded-2xl border border-zinc-200 bg-white px-3 py-2 shadow-sm focus-within:border-zinc-300">
                <textarea
                    ref={ref}
                    rows={1}
                    value={text}
                    placeholder={t('chat.placeholder')}
                    onChange={(e) => {
                        setText(e.target.value)
                        resize()
                    }}
                    onKeyDown={onKeyDown}
                    className="max-h-[200px] flex-1 resize-none bg-transparent py-1 text-sm text-zinc-900 outline-none placeholder:text-zinc-400"
                />
                {streaming ? (
                    <Button type="button" variant="soft" size="sm" shape="circle" onClick={onStop} aria-label="Durdur">
                        <Square className="size-4" />
                    </Button>
                ) : (
                    <Button
                        type="button"
                        variant="solid"
                        size="sm"
                        shape="circle"
                        onClick={submit}
                        disabled={!text.trim()}
                        aria-label="Gönder"
                    >
                        <Send className="size-4" />
                    </Button>
                )}
            </div>
        </div>
    )
}
