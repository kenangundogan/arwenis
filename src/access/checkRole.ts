import type { AuthUser } from './utils'

export const checkRole = (allRoles: string[] = [], user?: AuthUser | null): boolean => {
    if (!user || !('roles' in user)) return false
    return allRoles.some(
        (role) => user.roles && typeof user.roles === 'object' && 'slug' in user.roles && user.roles.slug === role,
    )
}
