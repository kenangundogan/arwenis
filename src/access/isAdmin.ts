import type { Access } from 'payload'

export const isAdmin: Access = ({ req: { user } }) => {
    if (!user || !('roles' in user) || typeof user.roles !== 'object' || user.roles === null) return false

    return 'slug' in user.roles && user.roles.slug === 'admin'
}
