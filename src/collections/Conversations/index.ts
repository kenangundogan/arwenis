import type { CollectionConfig } from 'payload'

import { canReadSecure, canDelete } from '@/access'
import { preventHardDelete } from '@/access/collection/preventHardDelete'

export const Conversations: CollectionConfig = {
    slug: 'conversations',
    labels: {
        singular: 'Konuşma',
        plural: 'Konuşmalar',
    },
    access: {
        create: () => false,
        read: canReadSecure('conversations'),
        update: () => false,
        delete: canDelete('conversations'),
    },
    admin: {
        group: 'Asistan',
        useAsTitle: 'title',
        defaultColumns: ['title', 'member', 'messageCount', 'tokensTotal', 'updatedAt'],
    },
    trash: true,
    fields: [
        {
            name: 'member',
            label: 'Üye',
            type: 'relationship',
            relationTo: 'members',
            index: true,
        },
        {
            name: 'folder',
            label: 'Klasör',
            type: 'relationship',
            relationTo: 'folders',
            index: true,
            admin: { position: 'sidebar' },
        },
        {
            name: 'title',
            label: 'Başlık',
            type: 'text',
        },
        {
            name: 'summary',
            label: 'Özet (K3b)',
            type: 'textarea',
            admin: { description: 'Konuşma özeti — her tur sonunda güncellenir (Faz 5)' },
        },
        {
            name: 'status',
            label: 'Durum',
            type: 'select',
            defaultValue: 'active',
            options: [
                { label: 'Aktif', value: 'active' },
                { label: 'Arşiv', value: 'archived' },
            ],
            admin: { position: 'sidebar' },
        },
        {
            name: 'messageCount',
            label: 'Mesaj Sayısı',
            type: 'number',
            defaultValue: 0,
            admin: { readOnly: true, position: 'sidebar' },
        },
        {
            name: 'tokensTotal',
            label: 'Toplam Token',
            type: 'number',
            defaultValue: 0,
            admin: { readOnly: true, position: 'sidebar' },
        },
        {
            name: 'lastMessageAt',
            label: 'Son Mesaj',
            type: 'date',
            index: true,
            admin: { readOnly: true, position: 'sidebar' },
        },
    ],
    hooks: {
        beforeDelete: [preventHardDelete],
    },
}
