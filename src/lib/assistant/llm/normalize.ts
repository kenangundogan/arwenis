import type { ChatMessage } from '../types'

export const splitSystem = (messages: ChatMessage[]): { system: string; rest: ChatMessage[] } => {
    const systemParts: string[] = []
    const rest: ChatMessage[] = []
    for (const m of messages) {
        if (m.role === 'system') systemParts.push(m.content)
        else rest.push(m)
    }
    return { system: systemParts.join('\n\n'), rest }
}

export const normalizeTurns = (messages: ChatMessage[]): ChatMessage[] => {
    const turns = messages.filter((m) => m.role !== 'system')

    let start = 0
    while (start < turns.length && turns[start].role === 'assistant') start++
    const trimmed = turns.slice(start)

    const merged: ChatMessage[] = []
    for (const m of trimmed) {
        const last = merged[merged.length - 1]
        if (last && last.role === m.role) {
            last.content = `${last.content}\n\n${m.content}`
        } else {
            merged.push({ role: m.role, content: m.content })
        }
    }
    return merged
}
