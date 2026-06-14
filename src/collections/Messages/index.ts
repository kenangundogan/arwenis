import type { CollectionConfig } from 'payload'

import { canReadSecure, canDelete } from '@/access'

export const Messages: CollectionConfig = {
    slug: 'messages',
    labels: {
        singular: 'Mesaj',
        plural: 'Mesajlar',
    },
    access: {
        create: () => false,
        read: canReadSecure('messages'),
        update: () => false,
        delete: canDelete('messages'),
    },
    admin: {
        description: 'Sohbetlerdeki tekil mesajlar (kullanıcı/asistan). Salt okunur — sunucu tarafında yazılır; kaynak atıfları ve token bilgisi içerir.',
        group: 'Asistan',
        useAsTitle: 'content',
        defaultColumns: ['content', 'role', 'conversation', 'createdAt'],
    },
    fields: [
        {
            name: 'conversation',
            label: 'Konuşma',
            type: 'relationship',
            relationTo: 'conversations',
            index: true,
            required: true,
        },
        {
            name: 'role',
            label: 'Rol',
            type: 'select',
            required: true,
            options: [
                { label: 'Kullanıcı', value: 'user' },
                { label: 'Asistan', value: 'assistant' },
            ],
        },
        {
            name: 'content',
            label: 'İçerik',
            type: 'textarea',
            required: true,
        },
        {
            name: 'citations',
            label: 'Kaynaklar',
            type: 'json',
            admin: { description: 'Kullanılan kaynaklar [{n,title,url,score}] (§4.2)' },
        },
        {
            type: 'row',
            fields: [
                { name: 'tokensIn', label: 'Token (girdi)', type: 'number', admin: { width: '50%' } },
                { name: 'tokensOut', label: 'Token (çıktı)', type: 'number', admin: { width: '50%' } },
            ],
        },
        {
            name: 'feedback',
            label: 'Geri Bildirim',
            type: 'select',
            options: [
                { label: '👍', value: 'up' },
                { label: '👎', value: 'down' },
            ],
            admin: { position: 'sidebar' },
        },
    ],
}
