import type { CollectionConfig } from 'payload'

import { memberOwnedRead, memberOwnedDelete } from '@/access/collection/memberOwned'

export const Memory: CollectionConfig = {
    slug: 'memory',
    labels: {
        singular: 'Hafıza',
        plural: 'Hafıza',
    },
    access: {
        create: () => false,
        read: memberOwnedRead('memory'),
        update: () => false,
        delete: memberOwnedDelete('memory'),
    },
    admin: {
        description: 'Üye hakkında konuşmalar arası hatırlanan kalıcı bilgiler (Katman 4). Salt okunur — sunucu tarafında çıkarılır.',
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
