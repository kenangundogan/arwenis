import type { PayloadRequest } from 'payload'
import type { User } from '@/payload-types'
import { isAdmin } from '../utils'

export async function canViewWidget(
    widgetSlug: string,
    req: PayloadRequest,
): Promise<boolean> {
    const user = req.user as User | null

    if (!user) return false

    if (isAdmin(user)) return true

    try {
        const permissions = await req.payload.find({
            collection: 'permissions',
            where: {
                user: {
                    equals: user.id,
                },
                isActive: {
                    equals: true,
                },
            },
            limit: 1,
        })

        const permission = permissions.docs[0]

        if (!permission || !permission.widgets || !Array.isArray(permission.widgets)) {
            return false
        }

        return (permission.widgets as string[]).includes(widgetSlug)
    } catch (error) {
        console.error('Widget permission check error:', error)
        return false
    }
}

export async function filterVisibleWidgets(
    widgetSlugs: string[],
    req: PayloadRequest,
): Promise<string[]> {
    const visibleWidgets: string[] = []

    for (const slug of widgetSlugs) {
        const canView = await canViewWidget(slug, req)
        if (canView) {
            visibleWidgets.push(slug)
        }
    }

    return visibleWidgets
}
