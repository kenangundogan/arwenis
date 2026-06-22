import type { PayloadRequest } from 'payload'

const SITEVERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify'

export interface RecaptchaConfig {
    enabled: boolean
    siteKey: string
    secretKey: string
    minScore: number
}

export const loadRecaptchaConfig = async (payload: PayloadRequest['payload']): Promise<RecaptchaConfig> => {
    try {
        const integrations = (await payload.findGlobal({ slug: 'integrations', draft: true, overrideAccess: true })) as any
        const r = integrations?.recaptcha ?? {}
        return {
            enabled: !!r.enabled,
            siteKey: r.siteKey || '',
            secretKey: r.secretKey || '',
            minScore: typeof r.minScore === 'number' ? r.minScore : 0.5,
        }
    } catch {
        return { enabled: false, siteKey: '', secretKey: '', minScore: 0.5 }
    }
}

export type RecaptchaVerdict = { ok: boolean; reason?: string }

export const verifyRecaptcha = async (
    payload: PayloadRequest['payload'],
    token: string | null | undefined,
    opts: { expectedAction?: string; remoteIp?: string } = {},
): Promise<RecaptchaVerdict> => {
    const cfg = await loadRecaptchaConfig(payload)
    if (!cfg.enabled || !cfg.secretKey) return { ok: true }
    if (!token) return { ok: false, reason: 'missing' }

    try {
        const params = new URLSearchParams({ secret: cfg.secretKey, response: token })
        if (opts.remoteIp && opts.remoteIp !== 'unknown') params.set('remoteip', opts.remoteIp)
        const res = await fetch(SITEVERIFY_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params,
        })
        if (!res.ok) {
            payload.logger.error({ status: res.status }, '[recaptcha] siteverify request failed')
            return { ok: true }
        }
        const data = (await res.json()) as { success?: boolean; score?: number; action?: string }
        if (!data.success) return { ok: false, reason: 'failed' }
        if (typeof data.score === 'number' && data.score < cfg.minScore) return { ok: false, reason: 'low_score' }
        if (opts.expectedAction && data.action && data.action !== opts.expectedAction) {
            return { ok: false, reason: 'action_mismatch' }
        }
        return { ok: true }
    } catch (err) {
        payload.logger.error({ err }, '[recaptcha] verification error')
        return { ok: true }
    }
}
