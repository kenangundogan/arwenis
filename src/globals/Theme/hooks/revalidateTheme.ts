import type { GlobalAfterChangeHook } from 'payload'

export const revalidateTheme: GlobalAfterChangeHook = ({ doc, req: { payload, context } }) => {
    if (!context.disableRevalidate) {
        payload.logger.info('Revalidating theme')
    }
    return doc
}
