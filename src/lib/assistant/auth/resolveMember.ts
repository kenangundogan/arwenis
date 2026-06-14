import type { PayloadRequest } from 'payload'
import { APIError } from 'payload'
import type { Member } from '@/payload-types'
import { readSessionToken, verifySession } from './session'

export const resolveMember = async (req: PayloadRequest): Promise<Member | null> => {
    const token = readSessionToken(req.headers?.get('cookie'))
    if (!token) return null
    const id = verifySession(token)
    if (!id) return null

    const eu = await req.payload
        .findByID({ collection: 'members', id, depth: 0, overrideAccess: true })
        .catch(() => null)
    if (!eu || (eu as { deletedAt?: unknown }).deletedAt) return null
    if (eu.status === 'blocked') throw new APIError('Erişiminiz engellenmiştir.', 403)
    return eu as Member
}
