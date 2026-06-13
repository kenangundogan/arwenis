import type { PayloadRequest } from 'payload'
import type { User, Permission } from '@/payload-types'

export const isAdmin = (user: User | null | undefined): boolean => {
    if (!user) return false

    if (Array.isArray(user.roles)) {
        return user.roles.some(
            (role) => typeof role === 'object' && role !== null && 'slug' in role && role.slug === 'admin'
        )
    }

    if (typeof user.roles === 'object' && user.roles !== null && 'slug' in user.roles) {
        return user.roles.slug === 'admin'
    }

    return false
}

export const getUserPermissionRecord = async (
    req: PayloadRequest,
    userId: string
): Promise<Permission | null> => {
    try {
        const result = await req.payload.find({
            collection: 'permissions',
            where: {
                and: [
                    { user: { equals: userId } },
                    { isActive: { equals: true } },
                ],
            },
            limit: 1,
            overrideAccess: true,
        })

        return result.docs[0] || null
    } catch (error) {
        console.error('getUserPermissionRecord error:', error)
        return null
    }
}

export const hasPermission = async (
    req: PayloadRequest,
    user: User | null | undefined,
    resource: string,
    action: 'create' | 'read' | 'update' | 'delete' | 'publish' | 'readVersions' | 'hardDelete'
): Promise<boolean> => {
    if (!user) return false

    if (isAdmin(user)) return true

    if (user.roles && typeof user.roles === 'string') {
        try {
            const fullUser = await req.payload.findByID({
                collection: 'users',
                id: user.id,
                overrideAccess: true,
            })
            if (isAdmin(fullUser)) return true
        } catch (e) {
            console.error('Error fetching full user in hasPermission:', e)
        }
    }

    try {
        const permissionRecord = await getUserPermissionRecord(req, user.id)

        if (!permissionRecord) return false

        const collectionPermission = (permissionRecord as any)[resource]

        if (collectionPermission && Array.isArray(collectionPermission.actions)) {
            const actions = collectionPermission.actions as string[]

            if (actions.includes('none')) {
                return false
            }

            return actions.includes(action)
        }

        return false
    } catch (error) {
        console.error('hasPermission error:', error)
        return false
    }
}

export const hasAnyPermission = async (
    req: PayloadRequest,
    user: User | null | undefined,
    resource: string,
): Promise<boolean> => {
    if (!user) return false
    if (isAdmin(user)) return true

    if (user.roles && typeof user.roles === 'string') {
        try {
            const fullUser = await req.payload.findByID({
                collection: 'users',
                id: user.id,
                overrideAccess: true,
            })
            if (isAdmin(fullUser)) return true
        } catch (e) {
            console.error('Error fetching full user in hasAnyPermission:', e)
        }
    }

    try {
        const permissionRecord = await getUserPermissionRecord(req, user.id)

        if (!permissionRecord) return false

        const resourcePermission = (permissionRecord as any)[resource]

        if (resourcePermission && typeof resourcePermission === 'object') {
            const actions = resourcePermission.actions as string[] | undefined

            if (!actions || (actions.length === 1 && actions[0] === 'none')) {
                return false
            }

            return true
        }

        return false
    } catch (error) {
        console.error('hasAnyPermission error:', error)
        return false
    }
}

export const getPermissionScope = async (
    req: PayloadRequest,
    user: User | null | undefined,
    resource: string,
): Promise<'none' | 'own' | 'all'> => {
    if (!user) return 'none'
    if (isAdmin(user)) return 'all'

    if (user.roles && typeof user.roles === 'string') {
        try {
            const fullUser = await req.payload.findByID({
                collection: 'users',
                id: user.id,
                overrideAccess: true,
            })
            if (isAdmin(fullUser)) return 'all'
        } catch (e) {
            console.error('Error fetching full user in getPermissionScope:', e)
        }
    }

    try {
        const permissionRecord = await getUserPermissionRecord(req, user.id)
        if (!permissionRecord) return 'none'

        const resourcePermission = (permissionRecord as any)[resource]

        if (resourcePermission && resourcePermission.scope) {
            return resourcePermission.scope as 'none' | 'own' | 'all'
        }

        return 'none'
    } catch (error) {
        console.error('getPermissionScope error:', error)
        return 'none'
    }
}
