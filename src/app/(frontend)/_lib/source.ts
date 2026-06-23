export type SourceInfo = { host: string; brand: string; favicon: string; href: string }

export const sourceInfo = (url?: string): SourceInfo | null => {
    if (!url) return null
    try {
        const u = new URL(url)
        if (u.protocol !== 'http:' && u.protocol !== 'https:') return null
        const host = u.hostname.replace(/^www\./, '')
        const sld = host.split('.')[0]
        const brand = sld ? sld.charAt(0).toUpperCase() + sld.slice(1) : host
        return {
            host,
            brand,
            favicon: `https://www.google.com/s2/favicons?sz=64&domain=${encodeURIComponent(u.hostname)}`,
            href: u.href,
        }
    } catch {
        return null
    }
}

export const formatCiteDate = (iso?: string): string | null => {
    if (!iso) return null
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return null
    try {
        return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
    } catch {
        return iso.slice(0, 10)
    }
}
