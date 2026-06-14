import type { Endpoint } from 'payload'
import { APIError } from 'payload'

import { checkRateLimit, getClientIp } from '@/lib/assistant/rateLimit'
import { assertSameOrigin } from '@/lib/assistant/auth/csrf'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const REGISTER_MAX = 10
const REGISTER_WINDOW_MS = 60 * 60 * 1000

const tooManyRequests = () =>
    new APIError('Çok fazla deneme yaptınız. Lütfen bir süre sonra tekrar deneyin.', 429)

const register: Endpoint = {
    path: '/assistant/auth/register',
    method: 'post',
    handler: async (req) => {
        assertSameOrigin(req)
        if (!checkRateLimit(`register:${getClientIp(req.headers)}`, REGISTER_MAX, REGISTER_WINDOW_MS)) {
            throw tooManyRequests()
        }
        const body = (await req.json?.()) ?? {}
        const email = (body.email ?? '').toString().trim().toLowerCase()
        const password = (body.password ?? '').toString()
        const displayName = (body.displayName ?? '').toString().trim().slice(0, 80) || undefined
        if (!EMAIL_RE.test(email)) throw new APIError('Geçerli bir e-posta giriniz.', 400)
        if (password.length < 8) throw new APIError('Şifre en az 8 karakter olmalıdır.', 400)

        const existing = await req.payload.find({
            collection: 'members',
            where: { email: { equals: email } },
            limit: 1,
            depth: 0,
            overrideAccess: true,
        })
        if (existing.docs.length) throw new APIError('Bu e-posta zaten kayıtlı.', 409)

        await req.payload.create({
            collection: 'members',
            data: { email, password, displayName, authProvider: 'email', status: 'active' },
            overrideAccess: true,
        })

        return Response.json({ ok: true })
    },
}

export const authEndpoints: Endpoint[] = [register]
