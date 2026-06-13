import type { Access } from 'payload'

export const isAdmin: Access = ({ req: { user } }) => {
    if (!user) return false

    const userRole = typeof user.roles === 'object' && user.roles !== null ? user.roles.slug : null

    return userRole === 'admin'
}
