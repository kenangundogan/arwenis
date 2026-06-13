import type { FieldAccess } from 'payload'
import { checkRole } from '../checkRole'

export const selfOrAdminField: FieldAccess = ({ req: { user }, id }) => {
    if (!user) return false
    if (checkRole(['admin'], user)) return true
    if (id && user.id === id) return true
    return false
}
