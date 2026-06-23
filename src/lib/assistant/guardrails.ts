import type { Citation } from './types'

export const sanitizeSourceText = (text: string): string =>
    text.replace(/\[(\d{1,3})\]/g, '($1)').trim()

export const fillTemplate = (template: string, vars: Record<string, string>): string =>
    template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key: string) => vars[key] ?? '')

export type UsedCitation = {
    n: number
    title?: string
    url?: string
    score: number
    snippet?: string
    publishedAt?: string
}

export const extractUsedCitations = (text: string, citations: Citation[]): UsedCitation[] => {
    const used = new Set<number>()
    const re = /\[(\d{1,3})\]/g
    let m: RegExpExecArray | null
    while ((m = re.exec(text)) !== null) {
        const n = parseInt(m[1], 10)
        if (n >= 1 && n <= citations.length) used.add(n)
    }
    return [...used]
        .sort((a, b) => a - b)
        .map((n) => {
            const c = citations[n - 1]
            const snippet = typeof c.text === 'string' ? c.text.replace(/\s+/g, ' ').trim().slice(0, 180) : ''
            return { n, title: c.title, url: c.url, score: c.score, snippet: snippet || undefined, publishedAt: c.publishedAt }
        })
}
