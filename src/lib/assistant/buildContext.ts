import type { ChatMessage, Citation } from './types'
import { fillTemplate, sanitizeSourceText } from './guardrails'

const PASSAGE_CHAR_CAP = 1500
const TOTAL_SOURCES_CHAR_CAP = 8000

export const formatSources = (citations: Citation[]): string => {
    const blocks: string[] = []
    let total = 0

    for (let i = 0; i < citations.length; i++) {
        const n = i + 1
        const c = citations[i]
        let text = sanitizeSourceText(c.text).slice(0, PASSAGE_CHAR_CAP)
        if (total >= TOTAL_SOURCES_CHAR_CAP) break
        if (total + text.length > TOTAL_SOURCES_CHAR_CAP) {
            text = text.slice(0, TOTAL_SOURCES_CHAR_CAP - total)
        }
        total += text.length
        const head = c.title ? c.title : `Kaynak ${n}`
        blocks.push(`[${n}] ${head}\n${text}`)
    }

    return blocks.join('\n\n')
}

export type BuildContextArgs = {
    systemPromptTemplate: string
    persona?: string | null
    userContext?: string | null
    citations: Citation[]
    history: ChatMessage[]
    userMessage: string
}

export const buildContext = (args: BuildContextArgs): ChatMessage[] => {
    const sources = formatSources(args.citations)
    const system = fillTemplate(args.systemPromptTemplate, {
        sources,
        persona: args.persona ?? '',
        user: args.userContext ?? '',
    })

    return [
        { role: 'system', content: system },
        ...args.history,
        { role: 'user', content: args.userMessage },
    ]
}
