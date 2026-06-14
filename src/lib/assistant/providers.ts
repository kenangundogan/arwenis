export type SelectOption = { label: string; value: string }

export type LLMAdapter = 'openai-compatible' | 'anthropic' | 'gemini'
export type LLMProviderId = 'openai-compatible' | 'openrouter' | 'anthropic' | 'gemini'

export type LLMProvider = {
    id: LLMProviderId
    label: string
        adapter: LLMAdapter
        baseUrl?: string
        editableBaseUrl: boolean
    defaultModel?: string
}

export const LLM_PROVIDERS: LLMProvider[] = [
    {
        id: 'openai-compatible',
        label: 'OpenAI Compatible (OpenAI / Azure / self-hosted)',
        adapter: 'openai-compatible',
        editableBaseUrl: true,
        defaultModel: 'gpt-4o-mini',
    },
    {
        id: 'openrouter',
        label: 'OpenRouter',
        adapter: 'openai-compatible',
        baseUrl: 'https://openrouter.ai/api/v1',
        editableBaseUrl: false,
        defaultModel: 'openai/gpt-4o-mini',
    },
    {
        id: 'anthropic',
        label: 'Anthropic (Claude)',
        adapter: 'anthropic',
        baseUrl: 'https://api.anthropic.com/v1',
        editableBaseUrl: false,
        defaultModel: 'claude-haiku-4-5-20251001',
    },
    {
        id: 'gemini',
        label: 'Google Gemini',
        adapter: 'gemini',
        baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
        editableBaseUrl: false,
        defaultModel: 'gemini-2.0-flash',
    },
]

export type VectorProviderId = 'pinecone' | 'qdrant' | 'weaviate'

export type VectorProvider = {
    id: VectorProviderId
    label: string
        supportsTextQuery: boolean
}

export const VECTOR_PROVIDERS: VectorProvider[] = [
    { id: 'pinecone', label: 'Pinecone', supportsTextQuery: false },
    { id: 'qdrant', label: 'Qdrant', supportsTextQuery: false },
    { id: 'weaviate', label: 'Weaviate', supportsTextQuery: true },
]

export type EmbeddingProviderId = 'openai' | 'openai-compatible' | 'gemini' | 'none'

export type EmbeddingProvider = {
    id: EmbeddingProviderId
    label: string
    defaultModel?: string
        defaultDimensions?: number
        editableBaseUrl?: boolean
}

export const EMBEDDING_PROVIDERS: EmbeddingProvider[] = [
    { id: 'openai', label: 'OpenAI', defaultModel: 'text-embedding-3-small', defaultDimensions: 1536 },
    {
        id: 'openai-compatible',
        label: 'OpenAI Compatible (Ollama / self-hosted)',
        editableBaseUrl: true,
        defaultModel: 'nomic-embed-text',
    },
    { id: 'gemini', label: 'Google Gemini', defaultModel: 'text-embedding-004', defaultDimensions: 768 },
    { id: 'none', label: 'Yok (vektör DB kendi vektörize ediyor)' },
]

export const llmOptions: SelectOption[] = LLM_PROVIDERS.map((p) => ({ label: p.label, value: p.id }))
export const vectorOptions: SelectOption[] = VECTOR_PROVIDERS.map((p) => ({ label: p.label, value: p.id }))
export const embeddingOptions: SelectOption[] = EMBEDDING_PROVIDERS.map((p) => ({ label: p.label, value: p.id }))

export const getLLMProvider = (id: string | null | undefined): LLMProvider | undefined =>
    LLM_PROVIDERS.find((p) => p.id === id)

export const getVectorProvider = (id: string | null | undefined): VectorProvider | undefined =>
    VECTOR_PROVIDERS.find((p) => p.id === id)

export const getEmbeddingProvider = (id: string | null | undefined): EmbeddingProvider | undefined =>
    EMBEDDING_PROVIDERS.find((p) => p.id === id)

export const isBaseUrlEditable = (id: string | null | undefined): boolean =>
    getLLMProvider(id)?.editableBaseUrl ?? false
