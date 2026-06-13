import type { Access } from 'payload'

import { isAdmin } from '../utils'
export const adminOnly: Access = ({ req: { user } }) => {
    return isAdmin(user)
}
