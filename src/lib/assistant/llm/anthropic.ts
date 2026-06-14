import type { LLMStreamParams, StreamEvent } from '../types'
import { parseSSE, safeErrorText, withTimeout } from './sse'
import { splitSystem, normalizeTurns } from './normalize'

export async function* anthropicStream(p: LLMStreamParams): AsyncGenerator<StreamEvent> {
    const { system } = splitSystem(p.messages)
    const turns = normalizeTurns(p.messages)

    let res: Response
    try {
        res = await fetch(`${p.baseUrl}/messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': p.apiKey,
                'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({
                model: p.model,
                max_tokens: p.maxTokens,
                temperature: p.temperature,
                ...(system ? { system } : {}),
                messages: turns.map((m) => ({ role: m.role, content: m.content })),
                stream: true,
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
        let json: any
        try {
            json = JSON.parse(data)
        } catch {
            continue
        }
        switch (json.type) {
            case 'content_block_delta':
                if (json.delta?.type === 'text_delta' && json.delta.text) {
                    yield { type: 'text', text: json.delta.text }
                }
                break
            case 'message_start': {
                const u = json.message?.usage
                if (u) yield { type: 'usage', inputTokens: u.input_tokens, outputTokens: u.output_tokens }
                break
            }
            case 'message_delta': {
                const u = json.usage
                if (u) yield { type: 'usage', outputTokens: u.output_tokens }
                break
            }
            case 'message_stop':
                yield { type: 'done' }
                return
            case 'error':
                yield { type: 'error', message: json.error?.message ?? 'Anthropic stream hatası' }
                return
        }
    }
    yield { type: 'done' }
}
