import type { LLMStreamParams, StreamEvent } from '../types'
import { parseSSE, safeErrorText, withTimeout } from './sse'

export async function* openaiCompatibleStream(p: LLMStreamParams): AsyncGenerator<StreamEvent> {
    let res: Response
    try {
        res = await fetch(`${p.baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${p.apiKey}`,
            },
            body: JSON.stringify({
                model: p.model,
                messages: p.messages,
                max_tokens: p.maxTokens,
                temperature: p.temperature,
                stream: true,
                stream_options: { include_usage: true },
            }),
            signal: withTimeout(p.signal),
        })
    } catch (err) {
        yield { type: 'error', message: `LLM bağlantı hatası: ${(err as Error).message}` }
        return
    }

    if (!res.ok) {
        yield { type: 'error', message: `LLM hatası (${res.status}): ${await safeErrorText(res)}`, status: res.status }
        return
    }

    for await (const data of parseSSE(res)) {
        if (data === '[DONE]') break
        let json: any
        try {
            json = JSON.parse(data)
        } catch {
            continue
        }
        const delta = json.choices?.[0]?.delta?.content
        if (delta) yield { type: 'text', text: delta }
        if (json.usage) {
            yield {
                type: 'usage',
                inputTokens: json.usage.prompt_tokens,
                outputTokens: json.usage.completion_tokens,
            }
        }
    }
    yield { type: 'done' }
}
