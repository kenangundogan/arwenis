import type { LLMAdapterId, LLMStreamFn, LLMStreamParams } from '../types'
import { openaiCompatibleStream } from './openai-compatible'
import { anthropicStream } from './anthropic'
import { geminiStream } from './gemini'

const ADAPTERS: Record<LLMAdapterId, LLMStreamFn> = {
    'openai-compatible': openaiCompatibleStream,
    anthropic: anthropicStream,
    gemini: geminiStream,
}

export const getLLMAdapter = (adapter: LLMAdapterId): LLMStreamFn => ADAPTERS[adapter]

export type CollectedCompletion = {
    text: string
    usage?: { inputTokens?: number; outputTokens?: number }
}

export const collectText = async (
    adapter: LLMStreamFn,
    params: LLMStreamParams,
): Promise<CollectedCompletion> => {
    let text = ''
    let usage: CollectedCompletion['usage']
    for await (const ev of adapter(params)) {
        if (ev.type === 'text') text += ev.text
        else if (ev.type === 'usage') usage = { inputTokens: ev.inputTokens, outputTokens: ev.outputTokens }
        else if (ev.type === 'error') throw new Error(ev.message)
        else if (ev.type === 'done') break
    }
    return { text, usage }
}

export { splitSystem, normalizeTurns } from './normalize'
