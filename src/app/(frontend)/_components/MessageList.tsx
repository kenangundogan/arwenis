'use client'

import MessageBubble from './MessageBubble'
import type { ChatMessage } from '../_hooks/useChatStream'

export default function MessageList({
    messages,
    onRegenerate,
    onSwitchVariant,
}: {
    messages: ChatMessage[]
    onRegenerate?: () => void
    onSwitchVariant?: (localId: string, dir: 1 | -1) => void
}) {
    const lastIdx = messages.length - 1
    return (
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6">
            {messages.map((m, i) => (
                <MessageBubble
                    key={m.localId ?? m.id ?? i}
                    message={m}
                    onRegenerate={i === lastIdx && m.role === 'assistant' ? onRegenerate : undefined}
                    onSwitchVariant={m.role === 'assistant' ? onSwitchVariant : undefined}
                />
            ))}
        </div>
    )
}
