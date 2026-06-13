import type { FieldAccess } from 'payload'
import { hasPermission } from '../utils'

export const canPublishField = (resource: string): FieldAccess => {
    return async ({ req }) => {
        return await hasPermission(req, req.user, resource, 'publish')
    }
}
