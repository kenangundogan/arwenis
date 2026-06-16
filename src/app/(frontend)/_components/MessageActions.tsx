'use client'

import { useState } from 'react'
import { Copy, Check, ThumbsUp, ThumbsDown } from 'lucide-react'
import { sendFeedback } from '../_lib/api'

export default function MessageActions({ messageId, content }: { messageId?: string; content: string }) {
    const [copied, setCopied] = useState(false)
    const [fb, setFb] = useState<'up' | 'down' | null>(null)

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
        setFb(next)
        if (next) await sendFeedback(messageId, next)
    }

    const btn = 'rounded p-1.5 transition hover:bg-zinc-100'

    return (
        <div className="mt-1.5 flex items-center gap-0.5 text-zinc-400">
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
        </div>
    )
}
