import type { Access, Where } from 'payload'
import { hasPermission, isAdmin, getPermissionScope } from '../utils'

export const canReadSecure = (resource: string): Access => {
    return async ({ req }) => {
        if (!req.user) return false
        if (isAdmin(req.user)) return true
        const hasReadPermission = await hasPermission(req, req.user, resource, 'read')
        if (!hasReadPermission) return false
        const scope = await getPermissionScope(req, req.user, resource)

        if (scope === 'all') return true

        if (scope === 'own') {
            if (resource === 'users') {
                return {
                    id: {
                        equals: req.user.id,
                    },
                } as Where
            }

            return {
                createdBy: {
                    equals: req.user.id,
                },
            } as Where
        }

        return false
    }
}
