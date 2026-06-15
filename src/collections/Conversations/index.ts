import type { CollectionConfig } from 'payload'

import { preventHardDelete } from '@/access/collection/preventHardDelete'
import {
    memberOwnedRead,
    memberOwnedUpdate,
    memberOwnedDelete,
    notMemberField,
} from '@/access/collection/memberOwned'

export const Conversations: CollectionConfig = {
    slug: 'conversations',
    labels: {
        singular: 'Konuşma',
        plural: 'Konuşmalar',
    },
    access: {
        create: () => false,
        read: memberOwnedRead('conversations'),
        update: memberOwnedUpdate,
        delete: memberOwnedDelete('conversations'),
    },
    admin: {
        description: 'Üyelerin asistan sohbetleri. Salt okunur — sunucu tarafında oluşturulur; mesaj/token sayacı ve özet içerir.',
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
            access: { update: notMemberField },
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
            label: 'Özet',
            type: 'textarea',
            access: { update: notMemberField },
            admin: { description: 'Konuşma özeti — her tur sonunda güncellenir.' },
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
            access: { update: notMemberField },
            admin: { readOnly: true, position: 'sidebar' },
        },
        {
            name: 'tokensTotal',
            label: 'Toplam Token',
            type: 'number',
            defaultValue: 0,
            access: { update: notMemberField },
            admin: { readOnly: true, position: 'sidebar' },
        },
        {
            name: 'lastMessageAt',
            label: 'Son Mesaj',
            type: 'date',
            index: true,
            access: { update: notMemberField },
            admin: { readOnly: true, position: 'sidebar' },
        },
        {
            name: 'messages',
            label: 'Mesajlar',
            type: 'join',
            collection: 'messages',
            on: 'conversation',
            defaultSort: 'createdAt',
            admin: {
                defaultColumns: ['role', 'content', 'feedback', 'createdAt'],
                description: 'Bu konuşmaya ait mesajlar (kronolojik).',
            },
        },
    ],
    hooks: {
        beforeDelete: [preventHardDelete],
    },
}
