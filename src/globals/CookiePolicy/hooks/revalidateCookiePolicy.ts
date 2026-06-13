import type { GlobalAfterChangeHook } from 'payload'

export const revalidateCookiePolicy: GlobalAfterChangeHook = ({ doc, req: { payload, context } }) => {
    if (!context.disableRevalidate) {
        payload.logger.info(`Revalidating cookie policy`)
    }

    return doc
}
