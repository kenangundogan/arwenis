'use client'

import { useState } from 'react'
import { Copy, Check, ThumbsUp, ThumbsDown, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react'
import { sendFeedback } from '../_lib/api'

export default function MessageActions({
    messageId,
    content,
    initialFeedback = null,
    onRegenerate,
    variantIndex,
    variantTotal,
    onPrev,
    onNext,
}: {
    messageId?: string
    content: string
    initialFeedback?: 'up' | 'down' | null
    onRegenerate?: () => void
    variantIndex?: number
    variantTotal?: number
    onPrev?: () => void
    onNext?: () => void
}) {
    const [copied, setCopied] = useState(false)
    const [fb, setFb] = useState<'up' | 'down' | null>(initialFeedback)

    async function copy() {
        try {
            await navigator.clipboard.writeText(content)
            setCopied(true)
            setTimeout(() => setCopied(false), 1500)
        } catch {
            /* clipboard unavailable */
        }
    }

    async function feedback(v: 'up' | 'down') {
        if (!messageId) return
        const next = fb === v ? null : v
        const prev = fb
        setFb(next)
        try {
            await sendFeedback(messageId, next)
        } catch {
            setFb(prev)
        }
    }

    const btn = 'rounded p-1.5 transition hover:bg-zinc-100'

    const hasVariants = typeof variantTotal === 'number' && variantTotal > 1 && typeof variantIndex === 'number'

    return (
        <div className="mt-1.5 flex items-center gap-0.5 text-zinc-400">
            {hasVariants && (
                <div className="mr-0.5 flex items-center gap-0.5">
                    <button
                        onClick={onPrev}
                        disabled={variantIndex === 0}
                        className={`${btn} hover:text-zinc-700 disabled:opacity-40 disabled:hover:bg-transparent`}
                        aria-label="Önceki sürüm"
                        title="Önceki sürüm"
                    >
                        <ChevronLeft className="size-3.5" />
                    </button>
                    <span className="text-xs tabular-nums">
                        {variantIndex + 1}/{variantTotal}
                    </span>
                    <button
                        onClick={onNext}
                        disabled={variantIndex === variantTotal - 1}
                        className={`${btn} hover:text-zinc-700 disabled:opacity-40 disabled:hover:bg-transparent`}
                        aria-label="Sonraki sürüm"
                        title="Sonraki sürüm"
                    >
                        <ChevronRight className="size-3.5" />
                    </button>
                </div>
            )}
            <button onClick={copy} className={`${btn} hover:text-zinc-700`} aria-label="Kopyala" title="Kopyala">
                {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
            </button>
            {messageId && (
                <>
                    <button
                        onClick={() => feedback('up')}
                        className={`${btn} ${fb === 'up' ? 'text-emerald-600' : 'hover:text-zinc-700'}`}
                        aria-label="Beğen"
                        title="Beğen"
                    >
                        <ThumbsUp className="size-3.5" />
                    </button>
                    <button
                        onClick={() => feedback('down')}
                        className={`${btn} ${fb === 'down' ? 'text-rose-600' : 'hover:text-zinc-700'}`}
                        aria-label="Beğenme"
                        title="Beğenme"
                    >
                        <ThumbsDown className="size-3.5" />
                    </button>
                </>
            )}
            {onRegenerate && (
                <button
                    onClick={onRegenerate}
                    className={`${btn} hover:text-zinc-700`}
                    aria-label="Yeniden üret"
                    title="Yeniden üret"
                >
                    <RefreshCw className="size-3.5" />
                </button>
            )}
        </div>
    )
}
