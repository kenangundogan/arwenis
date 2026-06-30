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

// images: { "16x9": [{name,w,h,url}…], "1x1": […] } | null — son eleman en büyük.
const pickImageUrl = (images: unknown): string | undefined => {
    if (!images || typeof images !== 'object') return undefined
    const obj = images as Record<string, Array<{ url?: unknown }> | undefined>
    const arr = obj['16x9']?.length ? obj['16x9'] : obj['1x1']?.length ? obj['1x1'] : null
    return arr ? safeHttpUrl(arr[arr.length - 1]?.url) : undefined
}

export const toCitation = (
    payload: Record<string, any> | undefined | null,
    opts: { id?: string; score: number; textKey: string; facetKeys?: string[]; recencyKey?: string },
): Citation | null => {
    const data = payload ?? {}
    const text = typeof data[opts.textKey] === 'string' ? data[opts.textKey] : ''
    if (!text) return null

    const url = safeHttpUrl(data.url ?? data.source ?? data.link ?? data.href)
    const image = pickImageUrl(data.images)
    const description =
        typeof data.description === 'string' && data.description.trim() ? data.description : undefined
    const titleRaw = data.title ?? data.name ?? data.heading
    const title = typeof titleRaw === 'string' ? titleRaw : undefined

    let publishedAt: string | undefined
    if (typeof data.publishedAt === 'string' && data.publishedAt.length > 0) {
        publishedAt = data.publishedAt
    } else if (opts.recencyKey && typeof data[opts.recencyKey] === 'number') {
        const d = new Date(data[opts.recencyKey])
        if (!Number.isNaN(d.getTime())) publishedAt = d.toISOString()
    }

    const facets: Record<string, string> = {}
    for (const k of opts.facetKeys ?? []) {
        const v = data[k]
        if (typeof v === 'string' && v.length > 0) facets[k] = v
        else if (typeof v === 'number') facets[k] = String(v)
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
