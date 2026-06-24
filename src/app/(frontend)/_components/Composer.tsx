'use client'

import React, { useRef, useState } from 'react'
import { Button } from 'eglador-ui-react'
import { ArrowUp, Square } from 'lucide-react'
import { useTranslations } from 'next-intl'

interface Props {
    onSend: (text: string) => void
    onStop: () => void
    streaming: boolean
}

export default function Composer({ onSend, onStop, streaming }: Props) {
    const t = useTranslations()
    const [text, setText] = useState('')
    const [multiline, setMultiline] = useState(false)
    const ref = useRef<HTMLTextAreaElement>(null)

    const resize = () => {
        const el = ref.current
        if (!el) return
        el.style.height = 'auto'
        el.style.height = `${Math.min(el.scrollHeight, 200)}px`
        setMultiline(el.scrollHeight > 36)
    }

    const submit = () => {
        const trimmed = text.trim()
        if (!trimmed || streaming) return
        onSend(trimmed)
        setText('')
        setMultiline(false)
        if (ref.current) ref.current.style.height = 'auto'
    }

    const onKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            submit()
        }
    }

    return (
        <div className="bg-white px-4 pb-3 pt-1">
            <div
                className={`mx-auto max-w-3xl border border-zinc-200 bg-white px-3 py-2.5 shadow-sm focus-within:border-zinc-300 ${
                    multiline ? 'rounded-3xl' : 'rounded-full'
                }`}
            >
                <div className={`flex gap-2 ${multiline ? 'flex-col' : 'items-center'}`}>
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
                        className={`max-h-[200px] resize-none bg-transparent px-1 text-sm leading-6 text-zinc-900 outline-none placeholder:text-zinc-400 ${
                            multiline ? 'w-full' : 'min-w-0 flex-1'
                        }`}
                    />
                    <div className={multiline ? 'flex justify-end' : ''}>
                        {streaming ? (
                            <Button
                                type="button"
                                variant="soft"
                                size="sm"
                                shape="circle"
                                onClick={onStop}
                                aria-label={t('chat.stop')}
                                icon={<Square />}
                            />
                        ) : (
                            <Button
                                type="button"
                                variant="solid"
                                size="sm"
                                shape="circle"
                                onClick={submit}
                                disabled={!text.trim()}
                                aria-label={t('chat.send')}
                                icon={<ArrowUp />}
                            />
                        )}
                    </div>
                </div>
            </div>
            <p className="mx-auto mt-2 max-w-3xl text-center text-xs text-zinc-400">{t('chat.disclaimer')}</p>
        </div>
    )
}
