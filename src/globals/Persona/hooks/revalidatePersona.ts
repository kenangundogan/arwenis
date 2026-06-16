import type { GlobalAfterChangeHook } from 'payload'
import { revalidateTag } from 'next/cache'

export const revalidatePersona: GlobalAfterChangeHook = ({ doc, req: { payload, context } }) => {
    if (!context.disableRevalidate) {
        payload.logger.info('Revalidating persona')
        revalidateTag('global_persona', 'max')
    }
    return doc
}
