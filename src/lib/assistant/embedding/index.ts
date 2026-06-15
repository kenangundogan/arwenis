import type { ResolvedEmbedding } from '../types'

export type EmbedFn = (text: string) => Promise<number[]>

const OPENAI_BASE = 'https://api.openai.com/v1'
const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta'
const EMBED_TIMEOUT_MS = 30_000

class EmbeddingError extends Error {
    constructor(message: string) {
        super(message)
        this.name = 'EmbeddingError'
    }
}

export const buildEmbedFn = (cfg: ResolvedEmbedding): EmbedFn | null => {
    if (cfg.providerId === 'none') return null

    if (!cfg.model) throw new EmbeddingError('Embedding modeli tanımlı değil.')

    if (cfg.providerId === 'openai' || cfg.providerId === 'openai-compatible') {
        const isCompatible = cfg.providerId === 'openai-compatible'
        const base = isCompatible ? cfg.baseUrl!.replace(/\/$/, '') : OPENAI_BASE

        if (!isCompatible && !cfg.apiKey) throw new EmbeddingError('OpenAI embedding için API anahtarı gerekli.')

        return async (text: string): Promise<number[]> => {
            const res = await fetch(`${base}/embeddings`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(cfg.apiKey ? { Authorization: `Bearer ${cfg.apiKey}` } : {}),
                },
                body: JSON.stringify({
                    model: cfg.model,
                    input: text,

                    ...(cfg.dimensions ? { dimensions: cfg.dimensions } : {}),
                }),
                signal: AbortSignal.timeout(EMBED_TIMEOUT_MS),
            })
            if (!res.ok) {
                throw new EmbeddingError(`Embedding hatası (${res.status}): ${(await res.text()).slice(0, 300)}`)
            }
            const json: any = await res.json()
            const vector = json.data?.[0]?.embedding
            if (!Array.isArray(vector)) throw new EmbeddingError('Embedding yanıtı geçersiz (data[0].embedding yok).')
            return vector
        }
    }

    if (cfg.providerId === 'gemini') {
        return async (text: string): Promise<number[]> => {
            const model = cfg.model!.startsWith('models/') ? cfg.model! : `models/${cfg.model}`
            const res = await fetch(`${GEMINI_BASE}/${model}:embedContent?key=${encodeURIComponent(cfg.apiKey!)}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: { parts: [{ text }] } }),
                signal: AbortSignal.timeout(EMBED_TIMEOUT_MS),
            })
            if (!res.ok) {
                throw new EmbeddingError(`Gemini embedding hatası (${res.status}): ${(await res.text()).slice(0, 300)}`)
            }
            const json: any = await res.json()
            const vector = json.embedding?.values
            if (!Array.isArray(vector)) throw new EmbeddingError('Gemini embedding yanıtı geçersiz.')
            return vector
        }
    }

    throw new EmbeddingError(`Bilinmeyen embedding sağlayıcısı: ${cfg.providerId}`)
}

export { EmbeddingError }
