import type { Endpoint } from 'payload'
import { APIError } from 'payload'

import { resolveMember } from '@/lib/assistant/auth/resolveMember'
import { assertSameOrigin } from '@/lib/assistant/auth/csrf'

const REAUTH_WINDOW_MS = 10 * 60 * 1000

export const deleteAccountEndpoint: Endpoint = {
    path: '/assistant/account/delete',
    method: 'post',
    handler: async (req) => {
        assertSameOrigin(req)
        const member = await resolveMember(req)
        if (!member) throw new APIError('Bu işlem için giriş yapmanız gerekir.', 401)
        const mid = String(member.id)

        const last = await req.payload.find({
            collection: 'member-login-sessions',
            where: { and: [{ member: { equals: mid } }, { status: { equals: 'success' } }] },
            sort: '-createdAt',
            limit: 1,
            depth: 0,
            overrideAccess: true,
        })
        const lastAt = last.docs[0]?.createdAt ? new Date(last.docs[0].createdAt as string).getTime() : 0
        if (!lastAt || Date.now() - lastAt > REAUTH_WINDOW_MS) {
            throw new APIError('Güvenlik için son 10 dakika içinde giriş yapmış olmanız gerekir. Lütfen çıkış yapıp tekrar giriş yapın.', 428)
        }

        await req.payload.db.updateOne({
            collection: 'members',
            id: mid,
            data: { status: 'blocked', deletedAt: new Date(), sessions: [] },
            returning: false,
        })

        const prefix = req.payload.config.cookiePrefix
        const secure = (process.env.SERVER_URL || '').startsWith('https') ? '; Secure' : ''
        const headers = new Headers({ 'Content-Type': 'application/json' })
        headers.append('Set-Cookie', `${prefix}-token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`)
        return new Response(JSON.stringify({ ok: true }), { headers })
    },
}
