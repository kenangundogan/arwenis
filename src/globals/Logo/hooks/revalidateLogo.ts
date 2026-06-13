import type { GlobalAfterChangeHook } from 'payload'

export const revalidateLogo: GlobalAfterChangeHook = ({ doc, req: { payload, context } }) => {
    if (!context.disableRevalidate) {
        payload.logger.info(`Revalidating logo`)
    }

    return doc
}
