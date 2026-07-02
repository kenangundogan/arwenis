import type { Citation, ResolvedRetrieval } from '../types'

export const safeHttpUrl = (value: unknown): string | undefined => {
    if (typeof value !== 'string') return undefined
    try {
        const u = new URL(value)
        if (u.protocol === 'http:' || u.protocol === 'https:') return u.toString()
    } catch {
            }
    return undefined
}

// images: { "16x9": [{name,w,h,url}…], "1x1": […] } | null — son eleman en büyük.
const pickImageUrl = (images: unknown): string | undefined => {
    if (!images || typeof images !== 'object') return undefined
    const obj = images as Record<string, Array<{ url?: unknown }> | undefined>
    const arr = obj['16x9']?.length ? obj['16x9'] : obj['1x1']?.length ? obj['1x1'] : null
    return arr ? safeHttpUrl(arr[arr.length - 1]?.url) : undefined
}

export const toCitation = (
    payload: Record<string, any> | undefined | null,
    cfg: ResolvedRetrieval,
    opts: { id?: string; score: number },
): Citation | null => {
    const data = payload ?? {}
    const text = typeof data[cfg.textKey] === 'string' ? data[cfg.textKey] : ''
    if (!text) return null

    const c = cfg.citation
    const url = c.urlKey ? safeHttpUrl(data[c.urlKey]) : undefined
    const image = c.imageKey ? pickImageUrl(data[c.imageKey]) : undefined
    const descRaw = c.descriptionKey ? data[c.descriptionKey] : undefined
    const description = typeof descRaw === 'string' && descRaw.trim() ? descRaw : undefined
    const titleRaw = c.titleKey ? data[c.titleKey] : undefined
    const title = typeof titleRaw === 'string' ? titleRaw : undefined

    let publishedAt: string | undefined
    const pubRaw = c.publishedAtKey ? data[c.publishedAtKey] : undefined
    if (typeof pubRaw === 'string' && pubRaw.length > 0) {
        publishedAt = pubRaw
    } else if (cfg.recencyKey && typeof data[cfg.recencyKey] === 'number') {
        const d = new Date(data[cfg.recencyKey])
        if (!Number.isNaN(d.getTime())) publishedAt = d.toISOString()
    }

    const facets: Record<string, string> = {}
    for (const f of cfg.facets) {
        const v = data[f.key]
        if (typeof v === 'string' && v.length > 0) facets[f.key] = v
        else if (typeof v === 'number') facets[f.key] = String(v)
    }

    return {
        id: opts.id,
        score: opts.score,
        text,
        description,
        url,
        title,
        image,
        publishedAt,
        facets: Object.keys(facets).length > 0 ? facets : undefined,
    }
}
