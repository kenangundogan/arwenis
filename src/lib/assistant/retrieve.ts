import type { AssistantConfig } from './loadConfig'
import type { ChatMessage, Citation } from './types'
import { resolveLLM, resolveRetrieval, resolveEmbedding } from './config'
import { getLLMAdapter, collectText } from './llm'
import { buildEmbedFn } from './embedding'
import { queryVector } from './vector'

export const contextualizeQuery = async (
    settings: AssistantConfig,
    history: ChatMessage[],
    message: string,
): Promise<string> => {
    if (history.length === 0) return message
    const template = settings.prompts?.contextualizePrompt
    if (!template) return message

    const llm = resolveLLM(settings)
    const adapter = getLLMAdapter(llm.adapter)
    const convo = history.map((m) => `${m.role}: ${m.content}`).join('\n')

    try {
        const { text } = await collectText(adapter, {
            baseUrl: llm.baseUrl,
            apiKey: llm.apiKey,
            model: llm.model,
            maxTokens: 128,
            temperature: 0,
            messages: [
                { role: 'system', content: template },
                { role: 'user', content: `Geçmiş:\n${convo}\n\nSon mesaj: ${message}\n\nBağımsız arama sorgusu:` },
            ],
        })
        return text.trim() || message
    } catch {

        return message
    }
}

export const retrieve = async (settings: AssistantConfig, query: string): Promise<Citation[]> => {
    const r = resolveRetrieval(settings)
    const e = resolveEmbedding(settings)
    const embed = buildEmbedFn(e)

    if (embed) {
        const vector = await embed(query)
        return queryVector(r, { vector })
    }
    if (r.supportsTextQuery) {
        return queryVector(r, { text: query })
    }
    throw new Error('Embedding "Yok" ve vektör DB metin-sorgu desteklemiyor — retrieval yapılamaz.')
}
