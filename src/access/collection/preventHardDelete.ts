import type { CollectionBeforeDeleteHook } from 'payload'
import { hasPermission, isAdmin } from '@/access/utils'
import { APIError } from 'payload'

export const preventHardDelete: CollectionBeforeDeleteHook = async ({ req, collection }) => {
    if (isAdmin(req.user)) {
        return
    }

    const canHardDelete = await hasPermission(req, req.user, collection.slug, 'hardDelete')

    if (!canHardDelete) {
        throw new APIError('Bu veriyi kalıcı olarak silme yetkiniz bulunmamaktadır. Sadece çöp kutusuna taşıyabilirsiniz.', 403)
    }
}
