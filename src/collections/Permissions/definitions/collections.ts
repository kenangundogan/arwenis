import type { Field } from 'payload'
import { scopeField, collectionActionsField } from '@/fields/permission'
import { contentCollections } from '@/collections/content'

export const collectionsGroup: Field[] = contentCollections.map((collection) => ({
    label: collection.labels?.plural || collection.slug,
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

