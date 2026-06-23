'use client'

import MessageBubble from './MessageBubble'
import type { ChatMessage } from '../_hooks/useChatStream'

export default function MessageList({ messages }: { messages: ChatMessage[] }) {
    return (
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6">
            {messages.map((m, i) => (
                <MessageBubble key={m.id ?? i} message={m} />
            ))}
        </div>
    )
}
