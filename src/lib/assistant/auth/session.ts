import { createHmac, timingSafeEqual } from 'crypto'

const SECRET = process.env.PAYLOAD_SECRET || ''
const TTL_SECONDS = 60 * 60 * 24 * 30
export const SESSION_COOKIE = 'arwenis_session'

export const signSession = (memberId: string): string => {
    const exp = Math.floor(Date.now() / 1000) + TTL_SECONDS
    const payload = `${memberId}.${exp}`
    const sig = createHmac('sha256', SECRET).update(payload).digest('hex')
    return `${payload}.${sig}`
}

export const verifySession = (token: string): string | null => {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const [id, exp, sig] = parts
    const expected = createHmac('sha256', SECRET).update(`${id}.${exp}`).digest('hex')
    const a = Buffer.from(sig)
    const b = Buffer.from(expected)
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null
    if (Number(exp) * 1000 < Date.now()) return null
    return id
}

export const sessionCookie = (token: string): string => {
    const secure = process.env.NODE_ENV === 'production' ? '; Secure' : ''
    return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${TTL_SECONDS}${secure}`
}

export const clearSessionCookie = (): string => `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`

export const readSessionToken = (cookieHeader: string | null | undefined): string | null => {
    if (!cookieHeader) return null
    for (const part of cookieHeader.split(';')) {
        const idx = part.indexOf('=')
        if (idx < 0) continue
        const key = part.slice(0, idx).trim()
        if (key === SESSION_COOKIE) return part.slice(idx + 1).trim()
    }
    return null
}
