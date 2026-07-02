import type { AssistantConfig } from './loadConfig'
import type { ResolvedLLM, ResolvedRetrieval, ResolvedEmbedding, Facet, FacetValue } from './types'
import { getLLMProvider, getVectorProvider } from './providers'

export class ConfigError extends Error {
    constructor(message: string) {
        super(message)
        this.name = 'ConfigError'
    }
}

export const assertSafeBaseUrl = (raw: string): string => {
    let u: URL
    try {
        u = new URL(raw)
    } catch {
        throw new ConfigError('Geçersiz baseUrl.')
    }
    if (u.protocol !== 'http:' && u.protocol !== 'https:') {
        throw new ConfigError('baseUrl yalnız http(s) olabilir.')
    }
    const host = u.hostname.replace(/^\[|\]$/g, '').toLowerCase()
    const blocked =
        host === 'metadata.google.internal' ||
        host === '169.254.169.254' ||
        host.startsWith('169.254.') ||
        host === 'fd00:ec2::254'
    if (blocked) {
        throw new ConfigError('Bu adres güvenlik nedeniyle engellendi (cloud metadata).')
    }
    return u.toString().replace(/\/$/, '')
}

export const resolveLLM = (settings: AssistantConfig): ResolvedLLM => {
    const llm = settings.llm
    const provider = getLLMProvider(llm?.provider)
    if (!provider) throw new ConfigError('LLM sağlayıcısı tanımlı/geçerli değil.')

    let baseUrl: string
    if (provider.editableBaseUrl) {
        if (!llm?.baseUrl) throw new ConfigError('OpenAI-compatible için baseUrl gereklidir.')
        baseUrl = assertSafeBaseUrl(llm.baseUrl)
    } else {

        baseUrl = provider.baseUrl!.replace(/\/$/, '')
    }

    const apiKey = llm?.apiKey ?? ''
    if (!apiKey) throw new ConfigError('LLM API anahtarı tanımlı değil.')

    return {
        providerId: provider.id,
        adapter: provider.adapter,
        baseUrl,
        apiKey,
        model: llm?.model || provider.defaultModel || '',
        maxTokens: llm?.maxTokens ?? 1024,
        temperature: llm?.temperature ?? 0.3,
    }
}

type PayloadFieldRow = {
    field: string
    roles: string[]
    label?: string
    filterType?: string
    values: FacetValue[]
}

const DEFAULT_PAYLOAD_FIELDS: PayloadFieldRow[] = [
    { field: 'text', roles: ['text'], values: [] },
    { field: 'title', roles: ['title'], values: [] },
    { field: 'url', roles: ['url'], values: [] },
    { field: 'images', roles: ['image'], values: [] },
    { field: 'description', roles: ['description'], values: [] },
]

export const parsePayloadFields = (raw: unknown): PayloadFieldRow[] => {
    const rows = (Array.isArray(raw) ? raw : [])
        .map(
            (m: any): PayloadFieldRow => ({
                field: typeof m?.field === 'string' ? m.field.trim() : '',
                roles: Array.isArray(m?.roles)
                    ? m.roles.filter((v: unknown): v is string => typeof v === 'string')
                    : [],
                label: typeof m?.label === 'string' && m.label ? m.label : undefined,
                filterType: typeof m?.filterType === 'string' ? m.filterType : undefined,
                values: Array.isArray(m?.allowedValues)
                    ? m.allowedValues
                          .map(
                              (v: any): FacetValue => ({
                                  value: typeof v === 'string' ? v : typeof v?.value === 'string' ? v.value : '',
                                  label: typeof v?.label === 'string' && v.label ? v.label : undefined,
                              }),
                          )
                          .filter((v: FacetValue) => v.value.length > 0)
                    : [],
            }),
        )
        .filter((m) => m.field.length > 0)
    return rows.length > 0 ? rows : DEFAULT_PAYLOAD_FIELDS
}

const facetsFromRows = (rows: PayloadFieldRow[]): Facet[] =>
    rows
        .filter((m) => m.roles.includes('filter'))
        .map((m) => ({
            key: m.field,
            type: (m.filterType === 'integer' || m.filterType === 'datetime'
                ? m.filterType
                : 'keyword') as Facet['type'],
            label: m.label || m.field,
            values: m.values,
        }))

export const facetsFromSettings = (settings: AssistantConfig): Facet[] =>
    facetsFromRows(parsePayloadFields(settings.retrieval?.payloadFields))

export const resolveRetrieval = (settings: AssistantConfig): ResolvedRetrieval => {
    const r = settings.retrieval
    const provider = getVectorProvider(r?.provider)
    if (!provider) throw new ConfigError('Vektör DB sağlayıcısı tanımlı/geçerli değil.')
    if (!r?.url) throw new ConfigError('Vektör DB URL\'i tanımlı değil.')
    if (!r?.index) throw new ConfigError('Vektör DB index/collection adı tanımlı değil.')

    const rows = parsePayloadFields(r.payloadFields)
    const byRole = (role: string): string | undefined => rows.find((m) => m.roles.includes(role))?.field

    return {
        providerId: provider.id,
        url: assertSafeBaseUrl(r.url),
        apiKey: r.apiKey ?? undefined,
        index: r.index,
        namespace: r.namespace ?? undefined,
        topK: r.topK ?? 5,
        minScore: r.minScore ?? 0.5,
        textKey: byRole('text') || 'text',
        recencyKey: byRole('sort'),
        citation: {
            titleKey: byRole('title'),
            urlKey: byRole('url'),
            imageKey: byRole('image'),
            descriptionKey: byRole('description'),
            publishedAtKey: byRole('date'),
            fetchFields: Array.from(new Set(rows.map((m) => m.field))),
        },
        facets: facetsFromRows(rows),
        supportsTextQuery: provider.supportsTextQuery,
    }
}

export const resolveEmbedding = (settings: AssistantConfig): ResolvedEmbedding => {
    const e = settings.embedding
    const providerId = (e?.provider ?? 'none') as ResolvedEmbedding['providerId']

    let baseUrl: string | undefined
    if (providerId === 'openai-compatible') {
        if (!e?.baseUrl) throw new ConfigError('OpenAI-compatible embedding için baseUrl gereklidir.')
        baseUrl = assertSafeBaseUrl(e.baseUrl)
    }

    return {
        providerId,
        baseUrl,
        apiKey: e?.apiKey ?? undefined,
        model: e?.model ?? undefined,
        dimensions: e?.dimensions ?? undefined,
    }
}
