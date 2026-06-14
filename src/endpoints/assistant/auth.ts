import type { Endpoint, PayloadRequest } from 'payload'
import { APIError } from 'payload'

import { resolveMember } from '@/lib/assistant/auth/resolveMember'
import { signSession, sessionCookie, clearSessionCookie } from '@/lib/assistant/auth/session'
import { hashPassword, verifyPassword } from '@/lib/assistant/auth/password'
import { checkRateLimit, getClientIp } from '@/lib/assistant/rateLimit'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const LOGIN_MAX = 20
const LOGIN_WINDOW_MS = 15 * 60 * 1000
const REGISTER_MAX = 10
const REGISTER_WINDOW_MS = 60 * 60 * 1000

const tooManyRequests = () =>
    new APIError('Çok fazla deneme yaptınız. Lütfen bir süre sonra tekrar deneyin.', 429)

const safeUser = (u: any) => ({
    id: u.id,
    email: u.email,
    displayName: u.displayName ?? null,
    authProvider: u.authProvider ?? 'email',
    status: u.status ?? 'active',
})

const findByEmail = async (req: PayloadRequest, email: string) => {
    const res = await req.payload.find({
        collection: 'members',
        where: { email: { equals: email } },
        limit: 1,
        depth: 0,
        overrideAccess: true,
        showHiddenFields: true,
    })
    return res.docs[0] as any | undefined
}

const register: Endpoint = {
    path: '/assistant/auth/register',
    method: 'post',
    handler: async (req) => {
        if (!checkRateLimit(`register:${getClientIp(req.headers)}`, REGISTER_MAX, REGISTER_WINDOW_MS)) {
            throw tooManyRequests()
        }
        const body = (await req.json?.()) ?? {}
        const email = (body.email ?? '').toString().trim().toLowerCase()
        const password = (body.password ?? '').toString()
        const displayName = (body.displayName ?? '').toString().trim().slice(0, 80) || undefined
        if (!EMAIL_RE.test(email)) throw new APIError('Geçerli bir e-posta giriniz.', 400)
        if (password.length < 8) throw new APIError('Şifre en az 8 karakter olmalıdır.', 400)

        if (await findByEmail(req, email)) throw new APIError('Bu e-posta zaten kayıtlı.', 409)

        const created = await req.payload.create({
            collection: 'members',
            data: {
                email,
                displayName,
                authProvider: 'email',
                status: 'active',
                passwordHash: hashPassword(password),
            },
            overrideAccess: true,
        })

        const token = signSession(String(created.id))
        return Response.json({ user: safeUser(created) }, { headers: { 'Set-Cookie': sessionCookie(token) } })
    },
}

const login: Endpoint = {
    path: '/assistant/auth/login',
    method: 'post',
    handler: async (req) => {
        if (!checkRateLimit(`login:${getClientIp(req.headers)}`, LOGIN_MAX, LOGIN_WINDOW_MS)) {
            throw tooManyRequests()
        }
        const body = (await req.json?.()) ?? {}
        const email = (body.email ?? '').toString().trim().toLowerCase()
        const password = (body.password ?? '').toString()
        if (!email || !password) throw new APIError('E-posta ve şifre gereklidir.', 400)

        const user = await findByEmail(req, email)
        if (!user || !verifyPassword(password, user.passwordHash)) {
            throw new APIError('E-posta veya şifre hatalı.', 401)
        }
        if (user.status === 'blocked') throw new APIError('Erişiminiz engellenmiştir.', 403)

        const token = signSession(String(user.id))
        return Response.json({ user: safeUser(user) }, { headers: { 'Set-Cookie': sessionCookie(token) } })
    },
}

const logout: Endpoint = {
    path: '/assistant/auth/logout',
    method: 'post',
    handler: async () => Response.json({ ok: true }, { headers: { 'Set-Cookie': clearSessionCookie() } }),
}

const me: Endpoint = {
    path: '/assistant/auth/me',
    method: 'get',
    handler: async (req) => {
        const eu = await resolveMember(req)
        return Response.json({ user: eu ? safeUser(eu) : null })
    },
}

export const authEndpoints: Endpoint[] = [register, login, logout, me]
