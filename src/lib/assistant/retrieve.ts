import type { AssistantConfig } from './loadConfig'
import type { ChatMessage, Citation, QueryPlan, Facet, FacetFilter } from './types'
import { resolveLLM, resolveRetrieval, resolveEmbedding, facetsFromSettings } from './config'
import { getLLMAdapter, collectText } from './llm'
import { buildEmbedFn } from './embedding'
import { queryVector } from './vector'

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

const describeFacets = (facets: Facet[]): string => {
    const keyword = facets.filter((f) => f.type === 'keyword')
    if (keyword.length === 0) return '(tanımlı faset yok)'
    return keyword
        .map((f) => {
            const vals = f.values.map((v) => (v.label && v.label !== v.value ? `${v.value} (${v.label})` : v.value))
            return `${f.key} (${f.label}): ${vals.length ? vals.join(', ') : 'serbest değer'}`
        })
        .join(' | ')
}

const normValue = (s: string): string => s.trim().toLocaleLowerCase('tr')

const validateFilters = (raw: unknown, facets: Facet[]): FacetFilter[] => {
    if (!Array.isArray(raw)) return []
    const byKey = new Map(facets.filter((f) => f.type === 'keyword').map((f) => [f.key, f]))
    const out: FacetFilter[] = []
    for (const item of raw) {
        const key = typeof item?.key === 'string' ? item.key : ''
        const facet = byKey.get(key)
        if (!facet) continue
        const rawValues: string[] = Array.isArray(item?.values)
            ? item.values.filter((v: unknown): v is string => typeof v === 'string' && v.length > 0)
            : []
        const values = rawValues
            .map((v) => {
                if (facet.values.length === 0) return v
                const hit =
                    facet.values.find((av) => av.value === v) ??
                    facet.values.find(
                        (av) => normValue(av.value) === normValue(v) || (av.label ? normValue(av.label) === normValue(v) : false),
                    )
                return hit ? hit.value : null
            })
            .filter((v): v is string => typeof v === 'string' && v.length > 0)
        if (values.length > 0) out.push({ key, values: Array.from(new Set(values)) })
    }
    return out
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

const PERSONAL_REF = /tuttuğ|taraftar|bana (uygun|göre|özel)|benim için|ilgi alan|ilgilendiğ|sevdiğ|favori|tercih etti|şehrim|memleket|mesleğ|işim|işyer|iş yer|çalıştığ|şirketim|firmam|nerede çalış|hangi (firma|şirket)|bana .*haber/i

const hasPersonalReference = (message: string): boolean => PERSONAL_REF.test(message)

export const planQuery = async (
    settings: AssistantConfig,
    history: ChatMessage[],
    message: string,
    userContext?: string | null,
): Promise<QueryPlan> => {
    const fallback: QueryPlan = { query: message, filters: [], wantsLatest: false }
    const template = settings.prompts?.queryPlanPrompt
    if (!template) return fallback

    const facets = facetsFromSettings(settings)
    const system = template.replace('{{facets}}', describeFacets(facets))
    const convo = history.map((m) => `${m.role}: ${m.content}`).join('\n')
    const ctx = userContext && hasPersonalReference(message) ? `${userContext}\n\n` : ''

    const llm = resolveLLM(settings)
    try {
        const { text } = await collectText(getLLMAdapter(llm.adapter), {
            baseUrl: llm.baseUrl,
            apiKey: llm.apiKey,
            model: llm.model,
            maxTokens: 200,
            temperature: 0,
            messages: [
                { role: 'system', content: system },
                { role: 'user', content: `${ctx}${convo ? `Geçmiş:\n${convo}\n\n` : ''}Son mesaj: ${message}` },
            ],
        })
        const json = parseJsonObject(text)
        if (!json) return fallback
        return {
            query: typeof json.query === 'string' ? json.query.trim() : message,
            filters: validateFilters(json.filters, facets),
            wantsLatest: json.wantsLatest === true,
        }
    } catch {
        return fallback
    }
}

export const retrieve = async (settings: AssistantConfig, plan: QueryPlan): Promise<Citation[]> => {
    const r = resolveRetrieval(settings)
    const facetKeys = new Set(r.facets.map((f) => f.key))
    const filters = plan.filters.filter((f) => facetKeys.has(f.key) && f.values.length > 0)
    const hasTopic = plan.query.trim().length > 0
    const useRecency = !hasTopic && (plan.wantsLatest || filters.length > 0)

    if (useRecency) {
        return queryVector(r, { latest: true, filters })
    }

    const e = resolveEmbedding(settings)
    const embed = buildEmbedFn(e)
    const query = plan.query.trim() || filters.flatMap((f) => f.values).join(' ')

    if (embed) {
        const vector = await embed(query)
        return queryVector(r, { vector, filters })
    }
    if (r.supportsTextQuery) {
        return queryVector(r, { text: query, filters })
    }
    throw new Error('Embedding "Yok" ve vektör DB metin-sorgu desteklemiyor — retrieval yapılamaz.')
}
