import type { Endpoint, PayloadRequest } from 'payload'
import { generatePayloadCookie, getFieldsToSign, jwtSign } from 'payload'
import { randomBytes, randomUUID } from 'crypto'

import { recordMemberLoginSession } from '@/collections/LoginSessions/recordLogin'

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'

const serverURL = (): string => (process.env.SERVER_URL || 'http://localhost:3000').replace(/\/+$/, '')
const redirectUri = (): string => `${serverURL()}/api/assistant/auth/google/callback`
const isSecure = (): boolean => serverURL().startsWith('https')
const rand = (n = 32): string => randomBytes(n).toString('hex')

const readCookie = (header: string | null | undefined, name: string): string | null => {
    const m = (header || '').match(new RegExp(`(?:^|; )${name}=([^;]+)`))
    return m ? decodeURIComponent(m[1]) : null
}

const decodeIdToken = (idToken: string): Record<string, any> => {
    const part = idToken.split('.')[1]
    const json = Buffer.from(part.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8')
    return JSON.parse(json)
}

type GoogleConfig = { enabled: boolean; clientId: string; clientSecret: string }

const loadGoogleConfig = async (payload: PayloadRequest['payload']): Promise<GoogleConfig> => {
    const integrations = (await payload.findGlobal({ slug: 'integrations', draft: true, overrideAccess: true })) as any
    const g = integrations?.google ?? {}
    return { enabled: !!g.enabled, clientId: g.clientId || '', clientSecret: g.clientSecret || '' }
}

const redirectTo = (location: string, extraCookies: string[] = []): Response => {
    const headers = new Headers({ Location: location })
    for (const c of extraCookies) headers.append('Set-Cookie', c)
    return new Response(null, { status: 302, headers })
}

const loginRedirect = (error: string): Response => redirectTo(`/login?error=${error}`, [
    `oauth_state=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`,
])

export const googleStartEndpoint: Endpoint = {
    path: '/assistant/auth/google/start',
    method: 'get',
    handler: async (req) => {
        const cfg = await loadGoogleConfig(req.payload)
        if (!cfg.enabled || !cfg.clientId || !cfg.clientSecret) return loginRedirect('google_disabled')

        const state = rand(16)
        const url = new URL(GOOGLE_AUTH_URL)
        url.searchParams.set('client_id', cfg.clientId)
        url.searchParams.set('redirect_uri', redirectUri())
        url.searchParams.set('response_type', 'code')
        url.searchParams.set('scope', 'openid email profile')
        url.searchParams.set('state', state)
        url.searchParams.set('access_type', 'online')
        url.searchParams.set('prompt', 'select_account')

        const stateCookie = `oauth_state=${state}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600${isSecure() ? '; Secure' : ''}`
        return redirectTo(url.toString(), [stateCookie])
    },
}

const buildSessionCookie = async (payload: PayloadRequest['payload'], member: any): Promise<string> => {
    const collection = payload.collections['members'].config
    const tokenExpiration = collection.auth.tokenExpiration ?? 7200

    let sid: string | undefined
    if (collection.auth.useSessions !== false) {
        sid = randomUUID()
        const now = new Date()
        const expiresAt = new Date(now.getTime() + tokenExpiration * 1000)
        const existing = Array.isArray(member.sessions)
            ? member.sessions.filter((s: any) => new Date(s.expiresAt) > now)
            : []
        const sessions = [...existing, { id: sid, createdAt: now, expiresAt }]
        await payload.db.updateOne({
            collection: 'members',
            id: member.id,
            data: { sessions },
            returning: false,
        })
    }

    const fieldsToSign = getFieldsToSign({
        collectionConfig: collection as any,
        email: member.email,
        user: member,
        ...(sid ? { sid } : {}),
    })
    const { token } = await jwtSign({ fieldsToSign, secret: payload.secret, tokenExpiration })
    return generatePayloadCookie({
        collectionAuthConfig: collection.auth,
        cookiePrefix: payload.config.cookiePrefix,
        token,
    }) as string
}

const resolveMember = async (payload: PayloadRequest['payload'], profile: Record<string, any>): Promise<any | null> => {
    const sub = String(profile.sub || '')
    if (!sub) return null

    const linked = await payload.find({
        collection: 'member-accounts',
        where: { and: [{ provider: { equals: 'google' } }, { providerAccountId: { equals: sub } }] },
        limit: 1,
        depth: 0,
        overrideAccess: true,
    })
    if (linked.docs[0]) {
        const rel = (linked.docs[0] as any).member
        const memberId = rel && typeof rel === 'object' ? rel.id : rel
        return payload.findByID({ collection: 'members', id: memberId, overrideAccess: true }).catch(() => null)
    }

    const email = typeof profile.email === 'string' ? profile.email : ''
    const emailVerified = profile.email_verified === true || profile.email_verified === 'true'

    if (email && emailVerified) {
        const byEmail = await payload.find({ collection: 'members', where: { email: { equals: email } }, limit: 1, overrideAccess: true })
        const existing = byEmail.docs[0] as any
        if (existing) {
            await payload.create({
                collection: 'member-accounts',
                data: { member: existing.id, provider: 'google', providerAccountId: sub },
                overrideAccess: true,
            })
            if (!existing._verified) {
                await payload.update({ collection: 'members', id: existing.id, data: { _verified: true } as any, overrideAccess: true })
            }
            return existing
        }
    }

    if (!email) return null
    const created = await payload.create({
        collection: 'members',
        data: {
            email,
            password: rand(24),
            firstName: typeof profile.given_name === 'string' ? profile.given_name : undefined,
            lastName: typeof profile.family_name === 'string' ? profile.family_name : undefined,
            _verified: true,
        } as any,
        overrideAccess: true,
    })
    await payload.create({
        collection: 'member-accounts',
        data: { member: created.id, provider: 'google', providerAccountId: sub },
        overrideAccess: true,
    })
    return created
}

const clearStateCookie = `oauth_state=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`

const successPage = (sessionCookie: string): Response => {
    const headers = new Headers({ 'Content-Type': 'text/html; charset=utf-8' })
    headers.append('Set-Cookie', sessionCookie)
    headers.append('Set-Cookie', clearStateCookie)
    const html = `<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=/chat"><title>Yönlendiriliyor…</title></head><body style="font-family:system-ui;color:#52525b;display:grid;place-items:center;height:100vh;margin:0"><script>location.replace('/chat')</script><a href="/chat">Devam etmek için tıklayın</a></body></html>`
    return new Response(html, { status: 200, headers })
}

export const googleCallbackEndpoint: Endpoint = {
    path: '/assistant/auth/google/callback',
    method: 'get',
    handler: async (req) => {
        const url = new URL(req.url ?? '')
        const code = url.searchParams.get('code')
        const state = url.searchParams.get('state')
        const cookieState = readCookie(req.headers?.get('cookie'), 'oauth_state')

        if (!code || !state || !cookieState || state !== cookieState) return loginRedirect('oauth_state')

        const cfg = await loadGoogleConfig(req.payload)
        if (!cfg.enabled || !cfg.clientId || !cfg.clientSecret) return loginRedirect('google_disabled')

        try {
            const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    code,
                    client_id: cfg.clientId,
                    client_secret: cfg.clientSecret,
                    redirect_uri: redirectUri(),
                    grant_type: 'authorization_code',
                }),
            })
            if (!tokenRes.ok) {
                req.payload.logger.error({ status: tokenRes.status, body: (await tokenRes.text()).slice(0, 300) }, '[oauth] google token exchange failed')
                return loginRedirect('oauth_token')
            }
            const tokens = await tokenRes.json()
            if (!tokens.id_token) return loginRedirect('oauth_token')

            const profile = decodeIdToken(tokens.id_token)
            const member = await resolveMember(req.payload, profile)
            if (!member) return loginRedirect('oauth_account')
            if ((member as any).status === 'blocked') return loginRedirect('blocked')

            const sessionCookie = await buildSessionCookie(req.payload, member)
            await recordMemberLoginSession(req, String(member.id))
            return successPage(sessionCookie)
        } catch (err) {
            req.payload.logger.error({ err }, '[oauth] google callback failed')
            return loginRedirect('oauth_error')
        }
    },
}
