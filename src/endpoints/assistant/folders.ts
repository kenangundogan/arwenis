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

const ownFolder = async (req: PayloadRequest, id: string, memberId: string) => {
    const f = await req.payload.findByID({ collection: 'folders', id, depth: 0, overrideAccess: true }).catch(() => null)
    if (!f || relId(f.member) !== memberId) throw new APIError('Klasör bulunamadı.', 404)
    return f
}

const list: Endpoint = {
    path: '/assistant/folders',
    method: 'get',
    handler: async (req) => {
        const eu = await requireMember(req)
        const res = await req.payload.find({
            collection: 'folders',
            where: { member: { equals: eu.id } },
            sort: 'name',
            limit: 100,
            depth: 0,
            overrideAccess: true,
        })
        return Response.json({ folders: res.docs.map((f) => ({ id: f.id, name: f.name })) })
    },
}

const create: Endpoint = {
    path: '/assistant/folders',
    method: 'post',
    handler: async (req) => {
        const eu = await requireMember(req)
        const body = (await req.json?.()) ?? {}
        const name = (body.name ?? '').toString().trim().slice(0, 80)
        if (!name) throw new APIError('`name` gereklidir.', 400)
        const f = await req.payload.create({
            collection: 'folders',
            data: { member: String(eu.id), name },
            overrideAccess: true,
        })
        return Response.json({ id: f.id, name: f.name })
    },
}

const rename: Endpoint = {
    path: '/assistant/folders',
    method: 'patch',
    handler: async (req) => {
        const eu = await requireMember(req)
        const body = (await req.json?.()) ?? {}
        const id = body.id as string | undefined
        const name = (body.name ?? '').toString().trim().slice(0, 80)
        if (!id || !name) throw new APIError('`id` ve `name` gereklidir.', 400)
        await ownFolder(req, id, String(eu.id))
        await req.payload.update({ collection: 'folders', id, data: { name }, overrideAccess: true })
        return Response.json({ ok: true, name })
    },
}

const remove: Endpoint = {
    path: '/assistant/folders',
    method: 'delete',
    handler: async (req) => {
        const eu = await requireMember(req)
        const id = new URL(req.url ?? '').searchParams.get('id')
        if (!id) throw new APIError('`id` gereklidir.', 400)
        await ownFolder(req, id, String(eu.id))

        await req.payload.update({
            collection: 'conversations',
            where: { and: [{ member: { equals: eu.id } }, { folder: { equals: id } }] },
            data: { folder: null },
            overrideAccess: true,
        })
        await req.payload.delete({ collection: 'folders', id, overrideAccess: true })
        return Response.json({ ok: true })
    },
}

const move: Endpoint = {
    path: '/assistant/conversation-folder',
    method: 'patch',
    handler: async (req) => {
        const eu = await requireMember(req)
        const body = (await req.json?.()) ?? {}
        const conversationId = body.conversationId as string | undefined
        const folderId = (body.folderId ?? null) as string | null
        if (!conversationId) throw new APIError('`conversationId` gereklidir.', 400)

        const conv = await req.payload
            .findByID({ collection: 'conversations', id: conversationId, depth: 0, overrideAccess: true })
            .catch(() => null)
        if (!conv || conv.deletedAt || relId(conv.member) !== String(eu.id)) {
            throw new APIError('Konuşma bulunamadı.', 404)
        }
        if (folderId) await ownFolder(req, folderId, String(eu.id))

        await req.payload.update({
            collection: 'conversations',
            id: conversationId,
            data: { folder: folderId },
            overrideAccess: true,
        })
        return Response.json({ ok: true })
    },
}

export const folderEndpoints: Endpoint[] = [list, create, rename, remove, move]
