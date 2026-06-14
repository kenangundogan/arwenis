import type { Field } from 'payload'
import { scopeField, collectionActionsField } from '@/fields/permission'

export const pluginCollections: { slug: string; label: string }[] = []

export const pluginsGroup: Field[] = pluginCollections.map((collection) => ({
    label: collection.label,
    type: 'collapsible',
    fields: [
        {
            name: collection.slug,
            type: 'group',
            fields: [
                scopeField,
                collectionActionsField,
            ],
        },
    ],
    admin: {
        initCollapsed: true,
    },
}))
