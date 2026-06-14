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

export const getClientIp = (headers: Headers | null | undefined): string => {
    return (
        headers?.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        headers?.get('x-real-ip') ||
        'unknown'
    )
}
