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

const loadOwned = async (req: PayloadRequest, id: string, memberId: string) => {
    const conv = await req.payload
        .findByID({ collection: 'conversations', id, depth: 0, overrideAccess: true })
        .catch(() => null)
    if (!conv || conv.deletedAt || relId(conv.member) !== memberId) {
        throw new APIError('Konuşma bulunamadı.', 404)
    }
    return conv
}

const queryParam = (req: PayloadRequest, key: string): string | null =>
    new URL(req.url ?? '').searchParams.get(key)

const list: Endpoint = {
    path: '/assistant/conversations',
    method: 'get',
    handler: async (req) => {
        const eu = await requireMember(req)
        const res = await req.payload.find({
            collection: 'conversations',
            where: { member: { equals: eu.id } },
            sort: '-lastMessageAt',
            limit: 100,
            depth: 0,
            overrideAccess: true,
        })
        const conversations = res.docs.map((c) => ({
            id: c.id,
            title: c.title || 'Yeni sohbet',
            lastMessageAt: c.lastMessageAt ?? c.updatedAt,
            messageCount: c.messageCount ?? 0,
            folder: relId(c.folder) ?? null,
        }))
        return Response.json({ conversations })
    },
}

const deleteAll: Endpoint = {
    path: '/assistant/conversations',
    method: 'delete',
    handler: async (req) => {
        const eu = await requireMember(req)
        await req.payload.update({
            collection: 'conversations',
            where: { and: [{ member: { equals: eu.id } }, { deletedAt: { exists: false } }] },
            data: { deletedAt: new Date().toISOString() },
            overrideAccess: true,
        })
        return Response.json({ ok: true })
    },
}

const getOne: Endpoint = {
    path: '/assistant/conversation',
    method: 'get',
    handler: async (req) => {
        const eu = await requireMember(req)
        const id = queryParam(req, 'id')
        if (!id) throw new APIError('`id` gereklidir.', 400)
        const conv = await loadOwned(req, id, String(eu.id))
        const msgs = await req.payload.find({
            collection: 'messages',
            where: { conversation: { equals: id } },
            sort: 'createdAt',
            limit: 500,
            depth: 0,
            overrideAccess: true,
        })
        return Response.json({
            conversation: { id: conv.id, title: conv.title || 'Yeni sohbet' },
            messages: msgs.docs.map((m) => ({
                id: m.id,
                role: m.role,
                content: m.content,
                citations: m.citations ?? [],
            })),
        })
    },
}

const rename: Endpoint = {
    path: '/assistant/conversation',
    method: 'patch',
    handler: async (req) => {
        const eu = await requireMember(req)
        const body = (await req.json?.()) ?? {}
        const id = body.id as string | undefined
        const title = (body.title ?? '').toString().trim().slice(0, 120)
        if (!id || !title) throw new APIError('`id` ve `title` gereklidir.', 400)
        await loadOwned(req, id, String(eu.id))
        await req.payload.update({ collection: 'conversations', id, data: { title }, overrideAccess: true })
        return Response.json({ ok: true, title })
    },
}

const deleteOne: Endpoint = {
    path: '/assistant/conversation',
    method: 'delete',
    handler: async (req) => {
        const eu = await requireMember(req)
        const id = queryParam(req, 'id')
        if (!id) throw new APIError('`id` gereklidir.', 400)
        await loadOwned(req, id, String(eu.id))
        await req.payload.update({
            collection: 'conversations',
            id,
            data: { deletedAt: new Date().toISOString() },
            overrideAccess: true,
        })
        return Response.json({ ok: true })
    },
}

export const conversationEndpoints: Endpoint[] = [list, deleteAll, getOne, rename, deleteOne]
