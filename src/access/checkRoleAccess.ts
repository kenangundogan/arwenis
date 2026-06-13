import type { Access } from 'payload'
import { checkRole } from './checkRole'

export const checkRoleAccess = (roles: string[] = []): Access => {
    return ({ req: { user } }) => {
        return checkRole(roles, user)
    }
}
