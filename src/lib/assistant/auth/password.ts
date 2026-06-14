import { scryptSync, randomBytes, timingSafeEqual } from 'crypto'

export const hashPassword = (password: string): string => {
    const salt = randomBytes(16).toString('hex')
    const dk = scryptSync(password, salt, 64).toString('hex')
    return `${salt}:${dk}`
}

export const verifyPassword = (password: string, stored: string | null | undefined): boolean => {
    if (!stored) return false
    const [salt, dk] = stored.split(':')
    if (!salt || !dk) return false
    const test = scryptSync(password, salt, 64).toString('hex')
    const a = Buffer.from(test, 'hex')
    const b = Buffer.from(dk, 'hex')
    return a.length === b.length && timingSafeEqual(a, b)
}
