import type { AssistantConfig } from './loadConfig'
import type { ChatMessage, Citation, QueryPlan } from './types'
import { resolveLLM, resolveRetrieval, resolveEmbedding } from './config'
import { getLLMAdapter, collectText } from './llm'
import { buildEmbedFn } from './embedding'
import { queryVector } from './vector'

const configuredCategories = (settings: AssistantConfig): string[] =>
    Array.isArray(settings.retrieval?.categories)
        ? settings.retrieval!.categories!
              .map((c) => (typeof c === 'string' ? c : c?.value))
              .filter((v): v is string => typeof v === 'string' && v.length > 0)
        : []

const parseJsonObject = (text: string): any => {
    const cleaned = text.replace(/```json\s*|```/gi, '')
    const start = cleaned.indexOf('{')
    const end = cleaned.lastIndexOf('}')
    if (start < 0 || end <= start) return null
    try {
        return JSON.parse(cleaned.slice(start, end + 1))
    } catch {
        return null
    }
}

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

export const planQuery = async (
    settings: AssistantConfig,
    history: ChatMessage[],
    message: string,
): Promise<QueryPlan> => {
    const fallback: QueryPlan = { query: message, categories: [], wantsLatest: false }
    const template = settings.prompts?.queryPlanPrompt
    if (!template) return fallback

    const categories = configuredCategories(settings)
    const system = template.replace(
        '{{categories}}',
        categories.length ? categories.join(', ') : '(tanımlı kategori yok)',
    )
    const convo = history.map((m) => `${m.role}: ${m.content}`).join('\n')

    const llm = resolveLLM(settings)
    try {
        const { text } = await collectText(getLLMAdapter(llm.adapter), {
            baseUrl: llm.baseUrl,
            apiKey: llm.apiKey,
            model: llm.model,
            maxTokens: 160,
            temperature: 0,
            messages: [
                { role: 'system', content: system },
                { role: 'user', content: `${convo ? `Geçmiş:\n${convo}\n\n` : ''}Son mesaj: ${message}` },
            ],
        })
        const json = parseJsonObject(text)
        if (!json) return fallback
        const cats = Array.isArray(json.categories)
            ? json.categories
                  .filter((c: unknown): c is string => typeof c === 'string')
                  .filter((c: string) => categories.length === 0 || categories.includes(c))
            : []
        return {
            query: typeof json.query === 'string' ? json.query.trim() : message,
            categories: cats,
            wantsLatest: json.wantsLatest === true,
        }
    } catch {
        return fallback
    }
}

export const retrieve = async (settings: AssistantConfig, plan: QueryPlan): Promise<Citation[]> => {
    const r = resolveRetrieval(settings)
    const categories = plan.categories.filter((c) => r.categories.length === 0 || r.categories.includes(c))
    const hasTopic = plan.query.trim().length > 0
    const useRecency = !hasTopic && (plan.wantsLatest || categories.length > 0)

    if (useRecency) {
        return queryVector(r, { latest: true, categories })
    }

    const e = resolveEmbedding(settings)
    const embed = buildEmbedFn(e)
    const query = plan.query.trim() || categories.join(' ')

    if (embed) {
        const vector = await embed(query)
        return queryVector(r, { vector, categories })
    }
    if (r.supportsTextQuery) {
        return queryVector(r, { text: query, categories })
    }
    throw new Error('Embedding "Yok" ve vektör DB metin-sorgu desteklemiyor — retrieval yapılamaz.')
}
