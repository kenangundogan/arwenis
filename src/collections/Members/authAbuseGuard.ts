import type { CollectionBeforeOperationHook } from 'payload'
import { APIError } from 'payload'

import { checkRateLimit, getClientIp } from '@/lib/assistant/rateLimit'
import { verifyRecaptcha } from '@/lib/assistant/auth/recaptcha'

const HOUR = 60 * 60 * 1000

const IP_CAPS: Record<string, number> = {
    create: 10,
    login: 30,
    forgotPassword: 10,
}

const EMAIL_FORGOT_CAP = 4

const RECAPTCHA_ACTIONS: Record<string, string> = {
    create: 'register',
    login: 'login',
    forgotPassword: 'forgot_password',
}

const tooMany = () => new APIError('Çok fazla istek gönderildi. Lütfen biraz sonra tekrar deneyin.', 429)
const verificationFailed = () => new APIError('Doğrulama başarısız. Lütfen tekrar deneyin.', 403)

export const authAbuseGuard: CollectionBeforeOperationHook = async ({ args, operation, req }) => {
    if (req?.payloadAPI !== 'REST') return args
    if (operation !== 'create' && operation !== 'login' && operation !== 'forgotPassword') return args
    if (operation === 'create' && (req.user as { collection?: string } | undefined)?.collection === 'users') return args

    const ip = getClientIp(req.headers)
    if (!checkRateLimit(`auth:${operation}:${ip}`, IP_CAPS[operation], HOUR)) throw tooMany()

    if (operation === 'forgotPassword') {
        const email = String((args as { data?: { email?: unknown } })?.data?.email ?? '').trim().toLowerCase()
        if (email && !checkRateLimit(`auth:forgot:email:${email}`, EMAIL_FORGOT_CAP, HOUR)) throw tooMany()
    }

    const token = req.headers?.get('x-recaptcha-token')
    const verdict = await verifyRecaptcha(req.payload, token, {
        expectedAction: RECAPTCHA_ACTIONS[operation],
        remoteIp: ip,
    })
    if (!verdict.ok) throw verificationFailed()

    return args
}
