import type { LLMStreamParams, StreamEvent } from '../types'
import { parseSSE, safeErrorText, withTimeout } from './sse'
import { splitSystem, normalizeTurns } from './normalize'

export async function* geminiStream(p: LLMStreamParams): AsyncGenerator<StreamEvent> {
    const { system } = splitSystem(p.messages)
    const turns = normalizeTurns(p.messages)

    const url = `${p.baseUrl}/models/${encodeURIComponent(p.model)}:streamGenerateContent?alt=sse&key=${encodeURIComponent(p.apiKey)}`

    let res: Response
    try {
        res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...(system ? { systemInstruction: { parts: [{ text: system }] } } : {}),
                contents: turns.map((m) => ({
                    role: m.role === 'assistant' ? 'model' : 'user',
                    parts: [{ text: m.content }],
                })),
                generationConfig: {
                    maxOutputTokens: p.maxTokens,
                    temperature: p.temperature,
                },
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
        const parts = json.candidates?.[0]?.content?.parts
        if (Array.isArray(parts)) {
            for (const part of parts) {
                if (part?.text) yield { type: 'text', text: part.text }
            }
        }
        if (json.usageMetadata) {
            yield {
                type: 'usage',
                inputTokens: json.usageMetadata.promptTokenCount,
                outputTokens: json.usageMetadata.candidatesTokenCount,
            }
        }
    }
    yield { type: 'done' }
}
