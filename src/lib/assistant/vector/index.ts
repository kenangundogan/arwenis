import type { Citation, ResolvedRetrieval } from '../types'
import { toCitation } from './helpers'

class VectorError extends Error {
    constructor(message: string) {
        super(message)
        this.name = 'VectorError'
    }
}

export type VectorQuery = {
        vector?: number[]
        text?: string
}

export type PingResult = {
    ok: boolean
        dimension?: number
    message?: string
}

export const queryVector = async (cfg: ResolvedRetrieval, q: VectorQuery): Promise<Citation[]> => {
    let raw: Citation[]
    switch (cfg.providerId) {
        case 'qdrant':
            raw = await queryQdrant(cfg, q)
            break
        case 'pinecone':
            raw = await queryPinecone(cfg, q)
            break
        case 'weaviate':
            raw = await queryWeaviate(cfg, q)
            break
        default:
            throw new VectorError(`Bilinmeyen vektör sağlayıcısı: ${cfg.providerId}`)
    }

    return raw.filter((c) => c.score >= cfg.minScore)
}

const requireVector = (q: VectorQuery): number[] => {
    if (!q.vector) throw new VectorError('Bu sağlayıcı için sorgu vektörü gerekli (embedding ayarlayın).')
    return q.vector
}

const queryQdrant = async (cfg: ResolvedRetrieval, q: VectorQuery): Promise<Citation[]> => {
    const res = await fetch(`${cfg.url}/collections/${encodeURIComponent(cfg.index)}/points/search`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(cfg.apiKey ? { 'api-key': cfg.apiKey } : {}),
        },
        body: JSON.stringify({
            vector: requireVector(q),
            limit: cfg.topK,
            with_payload: true,
        }),
    })
    if (!res.ok) throw new VectorError(`Qdrant hatası (${res.status}): ${(await res.text()).slice(0, 300)}`)
    const json: any = await res.json()
    const results: any[] = json.result ?? []
    return results
        .map((r) => toCitation(r.payload, { id: String(r.id), score: r.score, textKey: cfg.textKey }))
        .filter((c): c is Citation => c !== null)
}

const queryPinecone = async (cfg: ResolvedRetrieval, q: VectorQuery): Promise<Citation[]> => {
    const res = await fetch(`${cfg.url}/query`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(cfg.apiKey ? { 'Api-Key': cfg.apiKey } : {}),
        },
        body: JSON.stringify({
            vector: requireVector(q),
            topK: cfg.topK,
            includeMetadata: true,
            ...(cfg.namespace ? { namespace: cfg.namespace } : {}),
        }),
    })
    if (!res.ok) throw new VectorError(`Pinecone hatası (${res.status}): ${(await res.text()).slice(0, 300)}`)
    const json: any = await res.json()
    const matches: any[] = json.matches ?? []
    return matches
        .map((m) => toCitation(m.metadata, { id: String(m.id), score: m.score, textKey: cfg.textKey }))
        .filter((c): c is Citation => c !== null)
}

const queryWeaviate = async (cfg: ResolvedRetrieval, q: VectorQuery): Promise<Citation[]> => {
    const near = q.vector
        ? `nearVector: { vector: ${JSON.stringify(q.vector)} }`
        : q.text
            ? `nearText: { concepts: ${JSON.stringify([q.text])} }`
            : null
    if (!near) throw new VectorError('Weaviate için vektör veya metin sorgusu gerekli.')

    const gql = `{ Get { ${cfg.index}( ${near} limit: ${cfg.topK} ) { ${cfg.textKey} _additional { id certainty distance } } } }`

    const res = await fetch(`${cfg.url}/v1/graphql`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(cfg.apiKey ? { Authorization: `Bearer ${cfg.apiKey}` } : {}),
        },
        body: JSON.stringify({ query: gql }),
    })
    if (!res.ok) throw new VectorError(`Weaviate hatası (${res.status}): ${(await res.text()).slice(0, 300)}`)
    const json: any = await res.json()
    if (json.errors) throw new VectorError(`Weaviate GraphQL hatası: ${JSON.stringify(json.errors).slice(0, 300)}`)
    const items: any[] = json.data?.Get?.[cfg.index] ?? []
    return items
        .map((it) => {
            const add = it._additional ?? {}
            const score = typeof add.certainty === 'number' ? add.certainty : 1 - (add.distance ?? 1)
            return toCitation({ [cfg.textKey]: it[cfg.textKey] }, { id: add.id, score, textKey: cfg.textKey })
        })
        .filter((c): c is Citation => c !== null)
}

export const pingVector = async (cfg: ResolvedRetrieval): Promise<PingResult> => {
    try {
        switch (cfg.providerId) {
            case 'qdrant': {
                const res = await fetch(`${cfg.url}/collections/${encodeURIComponent(cfg.index)}`, {
                    headers: cfg.apiKey ? { 'api-key': cfg.apiKey } : {},
                })
                if (!res.ok) return { ok: false, message: `Qdrant (${res.status}): ${(await res.text()).slice(0, 200)}` }
                const json: any = await res.json()
                const vectors = json.result?.config?.params?.vectors

                const dimension =
                    typeof vectors?.size === 'number'
                        ? vectors.size
                        : typeof Object.values(vectors ?? {})[0] === 'object'
                            ? (Object.values(vectors ?? {})[0] as any)?.size
                            : undefined
                return { ok: true, dimension }
            }
            case 'pinecone': {
                const res = await fetch(`${cfg.url}/describe_index_stats`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(cfg.apiKey ? { 'Api-Key': cfg.apiKey } : {}),
                    },
                    body: '{}',
                })
                if (!res.ok) return { ok: false, message: `Pinecone (${res.status}): ${(await res.text()).slice(0, 200)}` }
                const json: any = await res.json()
                return { ok: true, dimension: json.dimension }
            }
            case 'weaviate': {
                const res = await fetch(`${cfg.url}/v1/meta`, {
                    headers: cfg.apiKey ? { Authorization: `Bearer ${cfg.apiKey}` } : {},
                })
                if (!res.ok) return { ok: false, message: `Weaviate (${res.status}): ${(await res.text()).slice(0, 200)}` }
                return { ok: true }
            }
            default:
                return { ok: false, message: `Bilinmeyen sağlayıcı: ${cfg.providerId}` }
        }
    } catch (err) {
        return { ok: false, message: (err as Error).message }
    }
}

export { VectorError }
