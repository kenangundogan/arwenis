'use client'

import { memo } from 'react'
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

function MessageBubble({
    message,
    onRegenerate,
    onSwitchVariant,
}: {
    message: ChatMessage
    onRegenerate?: () => void
    onSwitchVariant?: (localId: string, dir: 1 | -1) => void
}) {
    if (message.role === 'user') {
        return (
            <div className="flex justify-end">
                <div className="max-w-[80%] whitespace-pre-wrap wrap-break-word rounded-2xl bg-zinc-100 px-4 py-2.5 text-sm text-zinc-900">
                    {message.content}
                </div>
            </div>
        )
    }

    return (
        <div className="flex gap-3">
            <div className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-zinc-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/assets/images/symbol/symbol-black.svg" alt="Arwenis" className="size-4" />
            </div>
            <div className="min-w-0 flex-1 text-sm text-zinc-800">
                {message.content ? <Markdown content={message.content} citations={message.citations} /> : message.pending ? <Thinking /> : null}
                <SourceChips citations={message.citations} />
                {message.content && !message.pending && (
                    <MessageActions
                        messageId={message.id}
                        content={message.content}
                        onRegenerate={onRegenerate}
                        variantIndex={message.variants && message.variants.length > 1 ? (message.activeVariant ?? message.variants.length - 1) : undefined}
                        variantTotal={message.variants && message.variants.length > 1 ? message.variants.length : undefined}
                        onPrev={onSwitchVariant && message.localId ? () => onSwitchVariant(message.localId!, -1) : undefined}
                        onNext={onSwitchVariant && message.localId ? () => onSwitchVariant(message.localId!, 1) : undefined}
                    />
                )}
            </div>
        </div>
    )
}

export default memo(MessageBubble)
