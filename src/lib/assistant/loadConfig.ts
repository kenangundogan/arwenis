import type { Payload } from 'payload'

export type AssistantConfig = {
    llm?: {
        provider?: string | null
        model?: string | null
        apiKey?: string | null
        baseUrl?: string | null
        maxTokens?: number | null
        temperature?: number | null
    } | null
    embedding?: {
        provider?: string | null
        baseUrl?: string | null
        model?: string | null
        apiKey?: string | null
        dimensions?: number | null
    } | null
    retrieval?: {
        provider?: string | null
        url?: string | null
        apiKey?: string | null
        index?: string | null
        namespace?: string | null
        topK?: number | null
        minScore?: number | null
        textKey?: string | null
        recencyKey?: string | null
        facets?:
            | ({
                  key?: string | null
                  type?: string | null
                  label?: string | null
                  values?: ({ value?: string | null } | string)[] | null
              } | null)[]
            | null
    } | null
    prompts?: {
        systemPrompt?: string | null
        noContextReply?: string | null
        summaryPrompt?: string | null
        memoryExtractPrompt?: string | null
        titlePrompt?: string | null
        contextualizePrompt?: string | null
        queryPlanPrompt?: string | null
    } | null
    memory?: {
        persistConversations?: boolean | null
        historyWindow?: number | null
        crossConversation?: boolean | null
        retentionDays?: number | null
    } | null
    limits?: {
        dailyMessageCap?: number | null
        perIpRateLimit?: number | null
        maxConversationMessages?: number | null
        maxConversationsPerUser?: number | null
    } | null
    persona?: string | null
    welcomeMessage?: string | null
    suggestedQuestions?: { question: string }[] | null
}

export const loadAssistantConfig = async (
    payload: Payload,
    opts?: { draft?: boolean; locale?: 'tr' },
): Promise<AssistantConfig> => {
    const draft = opts?.draft ?? true
    const base = { draft, overrideAccess: true, depth: 0 } as const
    const common = opts?.locale ? { ...base, locale: opts.locale } : base

        const [llm, embedding, retrieval, prompts, memory, limits, persona] = await Promise.all([
        payload.findGlobal({ slug: 'llm', ...common }) as Promise<any>,
        payload.findGlobal({ slug: 'embedding', ...common }) as Promise<any>,
        payload.findGlobal({ slug: 'retrieval', ...common }) as Promise<any>,
        payload.findGlobal({ slug: 'prompts', ...common }) as Promise<any>,
        payload.findGlobal({ slug: 'memorySettings', ...common }) as Promise<any>,
        payload.findGlobal({ slug: 'limits', ...common }) as Promise<any>,
        payload.findGlobal({ slug: 'persona', ...common }) as Promise<any>,
    ])

    return {
        llm,
        embedding,
        retrieval,
        prompts,
        memory,
        limits,
        persona: persona?.persona ?? null,
        welcomeMessage: persona?.welcomeMessage ?? null,
        suggestedQuestions: persona?.suggestedQuestions ?? null,
    }
}
