import type { Access, Where } from 'payload'
import { hasPermission, hasAnyPermission, isAdmin, getPermissionScope } from '../utils'

export const canCreate = (resource: string): Access => {
    return async ({ req }) => {
        return await hasPermission(req, req.user, resource, 'create')
    }
}

export const canRead = (resource: string): Access => {
    return async ({ req }) => {
        if (req.user && isAdmin(req.user)) return true
        if (!req.user) {
            return {
                _status: {
                    equals: 'published',
                },
            }
        }

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

export const canUpdate = (resource: string): Access => {
    return async ({ req, data }) => {
        if (data && data._status === 'published') {
            return await hasPermission(req, req.user, resource, 'publish')
        }

        return await hasPermission(req, req.user, resource, 'update')
    }
}

export const canDelete = (resource: string): Access => {
    return async ({ req }) => {
        return await hasPermission(req, req.user, resource, 'delete')
    }
}

export const canPublish = (resource: string): Access => {
    return async ({ req }) => {
        return await hasPermission(req, req.user, resource, 'publish')
    }
}

export const canReadVersions = (resource: string): Access => {
    return async ({ req }) => {
        return await hasPermission(req, req.user, resource, 'readVersions')
    }
}

export const canReadOrPublished = (resource: string): Access => {
    return async ({ req }) => {
        if (!req.user) {
            return { _status: { equals: 'published' } }
        }

        if (await hasPermission(req, req.user, resource, 'read')) {
            return true
        }

        return { _status: { equals: 'published' } }
    }
}

export const canAccessAdmin = (resource: string): Access => {
    return async ({ req }) => {
        if (!req.user) return false

        if (isAdmin(req.user)) return true

        return await hasAnyPermission(req, req.user, resource)
    }
}

