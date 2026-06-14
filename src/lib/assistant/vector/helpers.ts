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
    opts: { id?: string; score: number; textKey: string },
): Citation | null => {
    const data = payload ?? {}
    const text = typeof data[opts.textKey] === 'string' ? data[opts.textKey] : ''
    if (!text) return null

    const url = safeHttpUrl(data.url ?? data.source ?? data.link ?? data.href)
    const titleRaw = data.title ?? data.name ?? data.heading
    const title = typeof titleRaw === 'string' ? titleRaw : undefined

    return {
        id: opts.id,
        score: opts.score,
        text,
        url,
        title,
    }
}
