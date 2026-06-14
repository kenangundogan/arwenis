import type { AssistantConfig } from './loadConfig'
import type { ChatMessage } from './types'
import { resolveLLM } from './config'
import { getLLMAdapter, collectText } from './llm'

export type SummaryResult = {
    summary?: string
    newFacts: string[]
}

const safeParseJson = (text: string): any => {
    const fenced = text.replace(/```json\s*|```/gi, '')
    const start = fenced.indexOf('{')
    const end = fenced.lastIndexOf('}')
    if (start < 0 || end <= start) return null
    try {
        return JSON.parse(fenced.slice(start, end + 1))
    } catch {
        return null
    }
}

export const summarizeAndExtract = async (
    settings: AssistantConfig,
    args: { priorSummary?: string | null; turns: ChatMessage[]; extractFacts: boolean },
): Promise<SummaryResult> => {
    const summaryTmpl = settings.prompts?.summaryPrompt
    if (!summaryTmpl) return { newFacts: [] }

    const parts = [summaryTmpl]
    if (args.extractFacts && settings.prompts?.memoryExtractPrompt) {
        parts.push(settings.prompts.memoryExtractPrompt)
    }
    const jsonShape = args.extractFacts
        ? '{"summary": "<güncel kısa özet>", "newFacts": ["<kalıcı gerçek>", ...]}'
        : '{"summary": "<güncel kısa özet>"}'
    const system = `${parts.join('\n\n')}\n\nÇIKTIYI YALNIZCA şu JSON olarak ver (başka metin yok): ${jsonShape}`

    const transcript = args.turns.map((m) => `${m.role}: ${m.content}`).join('\n')
    const userContent = `${args.priorSummary ? `Önceki özet:\n${args.priorSummary}\n\n` : ''}Konuşma:\n${transcript}`

    try {
        const llm = resolveLLM(settings)
        const { text } = await collectText(getLLMAdapter(llm.adapter), {
            baseUrl: llm.baseUrl,
            apiKey: llm.apiKey,
            model: llm.model,
            maxTokens: 500,
            temperature: 0.2,
            messages: [
                { role: 'system', content: system },
                { role: 'user', content: userContent },
            ],
        })
        const json = safeParseJson(text)
        if (!json) return { newFacts: [] }
        return {
            summary: typeof json.summary === 'string' ? json.summary.trim() : undefined,
            newFacts: Array.isArray(json.newFacts)
                ? json.newFacts.filter((f: unknown): f is string => typeof f === 'string' && f.trim().length > 0).map((f: string) => f.trim())
                : [],
        }
    } catch {
        return { newFacts: [] }
    }
}
