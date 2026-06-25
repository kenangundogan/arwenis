import type { CollectionConfig } from 'payload'

import { canDelete } from '@/access'
import { memberOwnedRead, memberOwnedUpdate, notMemberField } from '@/access/collection/memberOwned'

export const Messages: CollectionConfig = {
    slug: 'messages',
    labels: {
        singular: 'Mesaj',
        plural: 'Mesajlar',
    },
    access: {
        create: () => false,
        read: memberOwnedRead('messages'),
        update: memberOwnedUpdate,
        delete: canDelete('messages'),
    },
    admin: {
        description: 'Sohbetlerdeki tekil mesajlar (kullanıcı/asistan). Salt okunur — sunucu tarafında yazılır; üye yalnızca kendi mesajının geri bildirimini (👍/👎) güncelleyebilir.',
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
            access: { update: notMemberField },
        },
        {
            name: 'member',
            label: 'Üye',
            type: 'relationship',
            relationTo: 'members',
            index: true,
            access: { update: notMemberField },
            admin: { readOnly: true, position: 'sidebar' },
        },
        {
            name: 'role',
            label: 'Rol',
            type: 'select',
            required: true,
            access: { update: notMemberField },
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
            access: { update: notMemberField },
        },
        {
            name: 'citations',
            label: 'Kaynaklar',
            type: 'json',
            access: { update: notMemberField },
            admin: { description: 'Kullanılan kaynaklar [{n,title,url,score}]' },
        },
        {
            type: 'row',
            fields: [
                { name: 'tokensIn', label: 'Token (girdi)', type: 'number', access: { update: notMemberField }, admin: { width: '50%' } },
                { name: 'tokensOut', label: 'Token (çıktı)', type: 'number', access: { update: notMemberField }, admin: { width: '50%' } },
            ],
        },
        {
            name: 'variants',
            label: 'Sürümler',
            type: 'array',
            access: { update: notMemberField },
            admin: {
                readOnly: true,
                description: 'Yeniden üretilen yanıt sürümleri. İlki orijinal yanıttır; aktif sürüm "content" alanına yansıtılır.',
            },
            fields: [
                { name: 'content', label: 'İçerik', type: 'textarea', required: true },
                { name: 'citations', label: 'Kaynaklar', type: 'json' },
            ],
        },
        {
            name: 'activeVariant',
            label: 'Aktif Sürüm',
            type: 'number',
            defaultValue: 0,
            admin: { position: 'sidebar', description: 'Gösterilen sürümün dizini (0 tabanlı).' },
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
