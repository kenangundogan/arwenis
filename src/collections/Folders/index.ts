import type { CollectionConfig } from 'payload'

import { canReadSecure, canDelete } from '@/access'

export const Folders: CollectionConfig = {
    slug: 'folders',
    labels: {
        singular: 'Klasör',
        plural: 'Klasörler',
    },
    access: {
        create: () => false,
        read: canReadSecure('folders'),
        update: () => false,
        delete: canDelete('folders'),
    },
    admin: {
        group: 'Asistan',
        useAsTitle: 'name',
        defaultColumns: ['name', 'member', 'createdAt'],
    },
    fields: [
        {
            name: 'member',
            label: 'Üye',
            type: 'relationship',
            relationTo: 'members',
            index: true,
            required: true,
        },
        {
            name: 'name',
            label: 'Ad',
            type: 'text',
            required: true,
        },
    ],
}
