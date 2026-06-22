import type { AssistantConfig } from './loadConfig'
import type { ResolvedLLM, ResolvedRetrieval, ResolvedEmbedding } from './types'
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

export const resolveRetrieval = (settings: AssistantConfig): ResolvedRetrieval => {
    const r = settings.retrieval
    const provider = getVectorProvider(r?.provider)
    if (!provider) throw new ConfigError('Vektör DB sağlayıcısı tanımlı/geçerli değil.')
    if (!r?.url) throw new ConfigError('Vektör DB URL\'i tanımlı değil.')
    if (!r?.index) throw new ConfigError('Vektör DB index/collection adı tanımlı değil.')

    return {
        providerId: provider.id,
        url: assertSafeBaseUrl(r.url),
        apiKey: r.apiKey ?? undefined,
        index: r.index,
        namespace: r.namespace ?? undefined,
        topK: r.topK ?? 5,
        minScore: r.minScore ?? 0,
        textKey: r.textKey || 'text',
        recencyKey: r.recencyKey || undefined,
        facets: Array.isArray(r.facets)
            ? r.facets
                  .map((f) => ({
                      key: typeof f?.key === 'string' ? f.key.trim() : '',
                      type: (f?.type === 'integer' || f?.type === 'datetime' ? f.type : 'keyword') as
                          | 'keyword'
                          | 'integer'
                          | 'datetime',
                      label: typeof f?.label === 'string' && f.label ? f.label : (f?.key ?? ''),
                      values: Array.isArray(f?.values)
                          ? f.values
                                .map((v) => (typeof v === 'string' ? v : v?.value))
                                .filter((v): v is string => typeof v === 'string' && v.length > 0)
                          : [],
                  }))
                  .filter((f) => f.key.length > 0)
            : [],
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
