import type { Endpoint, PayloadRequest } from 'payload'
import { APIError } from 'payload'

import { resolveMember } from '@/lib/assistant/auth/resolveMember'

const relId = (v: unknown): string | undefined =>
    typeof v === 'string' ? v : v && typeof v === 'object' && 'id' in v ? String((v as { id: unknown }).id) : undefined

const requireMember = async (req: PayloadRequest) => {
    const eu = await resolveMember(req)
    if (!eu) throw new APIError('Oturum bulunamadı.', 401)
    return eu
}

const list: Endpoint = {
    path: '/assistant/memory',
    method: 'get',
    handler: async (req) => {
        const eu = await requireMember(req)
        const res = await req.payload.find({
            collection: 'memory',
            where: { member: { equals: eu.id } },
            sort: '-createdAt',
            limit: 200,
            depth: 0,
            overrideAccess: true,
        })
        return Response.json({ memory: res.docs.map((m) => ({ id: m.id, text: m.text })) })
    },
}

const remove: Endpoint = {
    path: '/assistant/memory',
    method: 'delete',
    handler: async (req) => {
        const eu = await requireMember(req)
        const id = new URL(req.url ?? '').searchParams.get('id')

        if (id) {
            const doc = await req.payload
                .findByID({ collection: 'memory', id, depth: 0, overrideAccess: true })
                .catch(() => null)
            if (!doc || relId(doc.member) !== String(eu.id)) throw new APIError('Kayıt bulunamadı.', 404)
            await req.payload.delete({ collection: 'memory', id, overrideAccess: true })
            return Response.json({ ok: true })
        }

        await req.payload.delete({
            collection: 'memory',
            where: { member: { equals: eu.id } },
            overrideAccess: true,
        })
        return Response.json({ ok: true })
    },
}

export const memoryEndpoints: Endpoint[] = [list, remove]
