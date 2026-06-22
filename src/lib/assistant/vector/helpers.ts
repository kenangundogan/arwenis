import type { Citation } from '../types'

export const safeHttpUrl = (value: unknown): string | undefined => {
    if (typeof value !== 'string') return undefined
    try {
        const u = new URL(value)
        if (u.protocol === 'http:' || u.protocol === 'https:') return u.toString()
    } catch {
            }
    return undefined
}

export const toCitation = (
    payload: Record<string, any> | undefined | null,
    opts: { id?: string; score: number; textKey: string; categoryKey?: string; dateKey?: string },
): Citation | null => {
    const data = payload ?? {}
    const text = typeof data[opts.textKey] === 'string' ? data[opts.textKey] : ''
    if (!text) return null

    const url = safeHttpUrl(data.url ?? data.source ?? data.link ?? data.href)
    const titleRaw = data.title ?? data.name ?? data.heading
    const title = typeof titleRaw === 'string' ? titleRaw : undefined

    const catRaw = opts.categoryKey ? data[opts.categoryKey] : data.category
    const category = typeof catRaw === 'string' && catRaw.length > 0 ? catRaw : undefined

    let publishedAt: string | undefined
    if (typeof data.publishedAt === 'string' && data.publishedAt.length > 0) {
        publishedAt = data.publishedAt
    } else if (opts.dateKey && typeof data[opts.dateKey] === 'number') {
        const d = new Date(data[opts.dateKey])
        if (!Number.isNaN(d.getTime())) publishedAt = d.toISOString()
    }

    return {
        id: opts.id,
        score: opts.score,
        text,
        url,
        title,
        category,
        publishedAt,
    }
}
