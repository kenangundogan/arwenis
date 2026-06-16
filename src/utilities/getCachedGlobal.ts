import config from '@payload-config'
import { type DataFromGlobalSlug, getPayload } from 'payload'
import { unstable_cache } from 'next/cache'
import type { Config } from '@/payload-types'

type GlobalSlug = keyof Config['globals']

async function getGlobal<T extends GlobalSlug>(slug: T, depth = 0): Promise<DataFromGlobalSlug<T>> {
    const payload = await getPayload({ config })
    return payload.findGlobal({ slug, depth })
}

export const getCachedGlobal = <T extends GlobalSlug>(slug: T, depth = 0) =>
    unstable_cache(async () => getGlobal<T>(slug, depth), [`global_${slug}`, String(depth)], {
        tags: [`global_${slug}`],
    })
