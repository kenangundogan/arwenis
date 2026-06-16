'use client'

import Markdown from './Markdown'
import SourceChips from './SourceChips'
import MessageActions from './MessageActions'
import type { ChatMessage } from '../_hooks/useChatStream'

function Thinking() {
    return (
        <span className="inline-flex items-center gap-1 py-1" aria-label="Düşünüyor">
            {[0, 150, 300].map((d) => (
                <span
                    key={d}
                    className="size-1.5 animate-bounce rounded-full bg-zinc-400"
                    style={{ animationDelay: `${d}ms` }}
                />
            ))}
        </span>
    )
}

export default function MessageBubble({ message }: { message: ChatMessage }) {
    if (message.role === 'user') {
        return (
            <div className="flex justify-end">
                <div className="max-w-[80%] whitespace-pre-wrap break-words rounded-2xl bg-zinc-900 px-4 py-2.5 text-sm text-white">
                    {message.content}
                </div>
            </div>
        )
    }

    return (
        <div className="flex gap-3">
            <div className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-[var(--brand)] text-[11px] font-semibold text-white">
                AI
            </div>
            <div className="min-w-0 flex-1 text-sm text-zinc-800">
                {message.content ? <Markdown content={message.content} /> : message.pending ? <Thinking /> : null}
                <SourceChips citations={message.citations} />
                {message.content && !message.pending && (
                    <MessageActions messageId={message.id} content={message.content} />
                )}
            </div>
        </div>
    )
}
