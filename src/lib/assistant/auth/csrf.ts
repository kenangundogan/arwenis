import type { PayloadRequest } from 'payload'
import { APIError } from 'payload'

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])

export const assertSameOrigin = (req: PayloadRequest): void => {
    const method = (req.method ?? '').toUpperCase()
    if (SAFE_METHODS.has(method)) return
    const site = req.headers?.get('sec-fetch-site')
    if (site && site !== 'same-origin' && site !== 'same-site' && site !== 'none') {
        throw new APIError('Geçersiz istek kaynağı.', 403)
    }
}
