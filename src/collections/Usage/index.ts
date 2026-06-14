import type { CollectionConfig } from 'payload'

import { canRead, canDelete } from '@/access'

export const Usage: CollectionConfig = {
    slug: 'usage',
    labels: {
        singular: 'Kullanım',
        plural: 'Kullanım',
    },
    access: {
        create: () => false,
        read: canRead('usage'),
        update: () => false,
        delete: canDelete('usage'),
    },
    admin: {
        group: 'Asistan',
        useAsTitle: 'day',
        defaultColumns: ['day', 'messageCount', 'tokenCount'],
        description: 'Günlük asistan kullanım sayacı (mesaj + token). Salt okunur — sunucu tarafında yazılır.',
    },
    fields: [
        {
            name: 'day',
            label: 'Gün (YYYY-MM-DD)',
            type: 'text',
            required: true,
            index: true,
            admin: { readOnly: true },
        },
        {
            name: 'messageCount',
            label: 'Mesaj Sayısı',
            type: 'number',
            defaultValue: 0,
            admin: { readOnly: true },
        },
        {
            name: 'tokenCount',
            label: 'Token Sayısı',
            type: 'number',
            defaultValue: 0,
            admin: { readOnly: true },
        },
    ],
}
