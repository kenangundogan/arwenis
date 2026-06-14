import type { PayloadRequest } from 'payload'
import { APIError } from 'payload'
import type { Member } from '@/payload-types'

type AuthedUser = Member & { collection?: string; status?: string }

export const resolveMember = async (req: PayloadRequest): Promise<Member | null> => {
    const user = req.user as AuthedUser | null | undefined
    if (!user || user.collection !== 'members') return null
    if (user.status === 'blocked') throw new APIError('Erişiminiz engellenmiştir.', 403)
    return user as Member
}
