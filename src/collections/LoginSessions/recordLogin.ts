import type { CollectionAfterLoginHook, PayloadRequest } from 'payload'

import { getClientIp } from '@/lib/assistant/rateLimit'
import { parseUserAgent } from './parseUserAgent'

const extractSession = (req: PayloadRequest) => {
    const headers = req?.headers
    const userAgent = headers?.get('user-agent') ?? ''
    const ua = parseUserAgent(userAgent)
    return {
        ipAddress: getClientIp(headers),
        userAgent: userAgent || undefined,
        browser: ua.browser,
        os: ua.os,
        deviceType: ua.deviceType,
        status: 'success' as const,
    }
}

export const recordAdminLogin: CollectionAfterLoginHook = async ({ req, user }) => {
    try {
        await req.payload.create({
            collection: 'login-sessions',
            data: { user: user.id, ...extractSession(req) },
            depth: 0,
            overrideAccess: true,
        })
    } catch (err) {
        req.payload.logger.error({ err, msg: 'login-sessions kaydı oluşturulamadı' })
    }
}

export const recordMemberLogin: CollectionAfterLoginHook = async ({ req, user }) => {
    try {
        await req.payload.create({
            collection: 'member-login-sessions',
            data: { member: user.id, ...extractSession(req) },
            depth: 0,
            overrideAccess: true,
        })
    } catch (err) {
        req.payload.logger.error({ err, msg: 'member-login-sessions kaydı oluşturulamadı' })
    }
}
