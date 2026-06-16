import { cache } from 'react'
import { headers as getHeaders } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'
import type { Member } from '@/payload-types'

export const getCurrentMember = cache(async (): Promise<Member | null> => {
    const payload = await getPayload({ config })
    const { user } = await payload.auth({ headers: await getHeaders() })
    if (!user || (user as { collection?: string }).collection !== 'members') return null
    return user as Member
})
