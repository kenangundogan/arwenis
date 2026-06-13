import type { Access } from 'payload'
import { hasPermission } from '../utils'

export const canReadGlobal = (globalSlug: string): Access => {
    return async ({ req }) => {
        if (!req.user) return true

        return await hasPermission(req, req.user, globalSlug, 'read')
    }
}

export const canUpdateGlobal = (globalSlug: string): Access => {
    return async ({ req }) => {
        return await hasPermission(req, req.user, globalSlug, 'update')
    }
}

export const canReadVersionsGlobal = (globalSlug: string): Access => {
    return async ({ req }) => {
        return await hasPermission(req, req.user, globalSlug, 'readVersions')
    }
}
