interface RateLimitEntry {
    count: number
    resetAt: number
}

const MAX_STORE_SIZE = 10_000
const store = new Map<string, RateLimitEntry>()

const cleanupExpired = (now: number): void => {
    for (const [key, entry] of store) {
        if (now > entry.resetAt) store.delete(key)
    }
}

export const checkRateLimit = (key: string, max: number, windowMs: number): boolean => {
    const now = Date.now()
    const entry = store.get(key)

    if (!entry || now > entry.resetAt) {
        if (store.size >= MAX_STORE_SIZE) cleanupExpired(now)
        if (store.size >= MAX_STORE_SIZE) return false
        store.set(key, { count: 1, resetAt: now + windowMs })
        return true
    }

    if (entry.count >= max) return false
    entry.count++
    return true
}

const TRUSTED_PROXY_HOPS = Math.max(0, Math.trunc(Number(process.env.TRUSTED_PROXY_HOPS)) || 0)

export const getClientIp = (headers: Headers | null | undefined): string => {
    const xff = headers?.get('x-forwarded-for')
    if (xff) {
        const hops = xff
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        if (hops.length > 0) {
            const idx = TRUSTED_PROXY_HOPS > 0 ? Math.max(0, hops.length - TRUSTED_PROXY_HOPS) : 0
            return hops[idx]
        }
    }
    return headers?.get('x-real-ip')?.trim() || 'unknown'
}
