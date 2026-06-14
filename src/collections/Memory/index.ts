import type { CollectionConfig } from 'payload'

import { canReadSecure, canDelete } from '@/access'

export const Memory: CollectionConfig = {
    slug: 'memory',
    labels: {
        singular: 'Hafıza',
        plural: 'Hafıza',
    },
    access: {
        create: () => false,
        read: canReadSecure('memory'),
        update: () => false,
        delete: canDelete('memory'),
    },
    admin: {
        group: 'Asistan',
        useAsTitle: 'text',
        defaultColumns: ['text', 'member', 'createdAt'],
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
            name: 'text',
            label: 'Gerçek',
            type: 'textarea',
            required: true,
            admin: { description: 'Kullanıcı hakkında kalıcı gerçek (örn. tercih, durum)' },
        },
    ],
}
