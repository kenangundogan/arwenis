import type { FieldAccess } from 'payload'
import { isAdmin } from '../utils'

export const adminOnlyField: FieldAccess = ({ req: { user } }) => {
    return isAdmin(user)
}

export const readOnlyField: FieldAccess = () => false

export const publicFieldAccess: FieldAccess = () => true
