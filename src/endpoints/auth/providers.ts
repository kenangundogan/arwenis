import type { Endpoint } from 'payload'

export const authProvidersEndpoint: Endpoint = {
    path: '/assistant/auth/providers',
    method: 'get',
    handler: async (req) => {
        const integrations = (await req.payload.findGlobal({
            slug: 'integrations',
            draft: true,
            overrideAccess: true,
        })) as any
        return Response.json({
            google: !!integrations?.google?.enabled,
            apple: !!integrations?.apple?.enabled,
        })
    },
}
