export type ChatRole = 'system' | 'user' | 'assistant'

export type ChatMessage = {
    role: ChatRole
    content: string
}

export type StreamEvent =
    | { type: 'text'; text: string }
    | { type: 'usage'; inputTokens?: number; outputTokens?: number }
    | { type: 'error'; message: string; status?: number }
    | { type: 'done' }

export type LLMStreamParams = {
    baseUrl: string
    apiKey: string
    model: string
    messages: ChatMessage[]
    maxTokens: number
    temperature: number
    signal?: AbortSignal
}

export type LLMAdapterId = 'openai-compatible' | 'anthropic' | 'gemini'

export type LLMStreamFn = (params: LLMStreamParams) => AsyncGenerator<StreamEvent>

export type ResolvedLLM = {
    providerId: string
    adapter: LLMAdapterId
    baseUrl: string
    apiKey: string
    model: string
    maxTokens: number
    temperature: number
}

export type ResolvedRetrieval = {
    providerId: 'pinecone' | 'qdrant' | 'weaviate'
    url: string
    apiKey?: string
    index: string
    namespace?: string
    topK: number
    minScore: number
    textKey: string
    supportsTextQuery: boolean
}

export type ResolvedEmbedding = {
    providerId: 'openai' | 'openai-compatible' | 'gemini' | 'none'
        baseUrl?: string
    apiKey?: string
    model?: string
    dimensions?: number
}

export type Citation = {
    id?: string
    score: number
    text: string
    url?: string
    title?: string
}
