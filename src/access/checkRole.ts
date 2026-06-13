import type { User } from '@/payload-types'

export const checkRole = (allRoles: string[] = [], user?: User | null): boolean => {
    if (user) {
        if (
            allRoles.some((role) => {
                return user?.roles && typeof user.roles === 'object' && user.roles.slug === role
            })
        )
            return true
    }

    return false
}
