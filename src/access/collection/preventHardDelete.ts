import type { CollectionBeforeDeleteHook } from 'payload'
import { hasPermission } from '@/access/utils'
import { APIError } from 'payload'

export const preventHardDelete: CollectionBeforeDeleteHook = async ({ req, collection }) => {
    if (req.user && typeof req.user.roles === 'object' && req.user.roles?.slug === 'admin') {
        return
    }

    const canHardDelete = await hasPermission(req, req.user, collection.slug, 'hardDelete')

    if (!canHardDelete) {
        throw new APIError('Bu veriyi kalıcı olarak silme yetkiniz bulunmamaktadır. Sadece çöp kutusuna taşıyabilirsiniz.', 403)
    }
}
