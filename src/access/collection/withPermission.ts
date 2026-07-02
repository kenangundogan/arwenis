import type { Access, Where } from 'payload'
import { hasPermission, hasAnyPermission, isAdmin, getPermissionScope } from '../utils'

export const canCreate = (resource: string): Access => {
    return async ({ req }) => {
        return await hasPermission(req, req.user, resource, 'create')
    }
}

const ownScopeWhere = (resource: string, userId: string | number): Where =>
    resource === 'users' ? { id: { equals: userId } } : { createdBy: { equals: userId } }

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
        if (scope === 'own') return ownScopeWhere(resource, req.user.id)
        return false
    }
}

export const canUpdate = (resource: string): Access => {
    return async ({ req, data }) => {
        const action = data && data._status === 'published' ? 'publish' : 'update'
        if (!(await hasPermission(req, req.user, resource, action))) return false
        if (isAdmin(req.user)) return true

        const scope = await getPermissionScope(req, req.user, resource)
        if (scope === 'all') return true
        if (scope === 'own' && req.user) return ownScopeWhere(resource, req.user.id)
        return false
    }
}

export const canDelete = (resource: string): Access => {
    return async ({ req }) => {
        if (!(await hasPermission(req, req.user, resource, 'delete'))) return false
        if (isAdmin(req.user)) return true

        const scope = await getPermissionScope(req, req.user, resource)
        if (scope === 'all') return true
        if (scope === 'own' && req.user) return ownScopeWhere(resource, req.user.id)
        return false
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

