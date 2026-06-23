import type { Endpoint } from 'payload'
import { APIError } from 'payload'

import { resolveMember } from '@/lib/assistant/auth/resolveMember'

export const exportEndpoint: Endpoint = {
    path: '/assistant/export',
    method: 'get',
    handler: async (req) => {
        const member = await resolveMember(req)
        if (!member) throw new APIError('Bu işlem için giriş yapmanız gerekir.', 401)
        const mid = String(member.id)

        const [convs, mems] = await Promise.all([
            req.payload.find({ collection: 'conversations', where: { member: { equals: mid } }, limit: 1000, sort: '-createdAt', depth: 0, overrideAccess: true }),
            req.payload.find({ collection: 'memory', where: { member: { equals: mid } }, limit: 1000, sort: '-createdAt', depth: 0, overrideAccess: true }),
        ])
        const convIds = convs.docs.map((c) => c.id)
        const msgs = convIds.length
            ? await req.payload.find({ collection: 'messages', where: { conversation: { in: convIds } }, limit: 5000, sort: 'createdAt', depth: 0, overrideAccess: true })
            : { docs: [] as any[] }

        const m = member as any
        const data = {
            exportedAt: new Date().toISOString(),
            member: { id: mid, email: m.email, firstName: m.firstName ?? null, lastName: m.lastName ?? null, createdAt: m.createdAt },
            conversations: convs.docs.map((c: any) => ({ id: String(c.id), title: c.title ?? null, summary: c.summary ?? null, createdAt: c.createdAt })),
            messages: (msgs.docs as any[]).map((x) => ({ id: String(x.id), conversation: String(x.conversation), role: x.role, content: x.content, createdAt: x.createdAt })),
            memory: (mems.docs as any[]).map((x) => ({ text: x.text, createdAt: x.createdAt })),
        }

        return new Response(JSON.stringify(data, null, 2), {
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
                'Content-Disposition': 'attachment; filename="arwenis-verilerim.json"',
            },
        })
    },
}
