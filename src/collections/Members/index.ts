import type { CollectionConfig } from 'payload'
import { APIError } from 'payload'

import { canReadSecure, canDelete } from '@/access'
import { preventHardDelete } from '@/access/collection/preventHardDelete'

export const Members: CollectionConfig = {
    slug: 'members',
    labels: {
        singular: 'Üye',
        plural: 'Üyeler',
    },
    auth: {
        tokenExpiration: 60 * 60 * 24 * 30,
        maxLoginAttempts: 5,
        lockTime: 10 * 60 * 1000,
        cookies: { sameSite: 'Lax' },
    },
    access: {
        create: () => false,
        read: canReadSecure('members'),
        update: () => false,
        delete: canDelete('members'),
    },
    admin: {
        description: 'Asistan son kullanıcıları (üyeler). Admin kullanıcılarından tamamen ayrı; kendi giriş sistemiyle oluşturulur.',
        group: 'Asistan',
        useAsTitle: 'email',
        defaultColumns: ['email', 'displayName', 'authProvider', 'status', 'createdAt'],
        listSearchableFields: ['email', 'displayName', 'externalId'],
    },
    trash: true,
    fields: [
        {
            name: 'authProvider',
            label: 'Kimlik Kaynağı',
            type: 'select',
            required: true,
            defaultValue: 'email',
            options: [
                { label: 'E-posta', value: 'email' },
                { label: 'OAuth', value: 'oauth' },
            ],
            admin: { readOnly: true, position: 'sidebar' },
        },
        {
            name: 'email',
            label: 'E-posta',
            type: 'email',
            required: true,
            unique: true,
            index: true,
        },
        {
            name: 'externalId',
            label: 'Harici ID',
            type: 'text',
            index: true,
            admin: { readOnly: true, description: 'OAuth sağlayıcı kimliği (sub)' },
        },
        {
            name: 'displayName',
            label: 'Görünen Ad',
            type: 'text',
        },
        {
            name: 'status',
            label: 'Durum',
            type: 'select',
            required: true,
            defaultValue: 'active',
            options: [
                { label: 'Aktif', value: 'active' },
                { label: 'Engelli', value: 'blocked' },
            ],
            admin: { position: 'sidebar' },
        },
        {
            name: 'locale',
            label: 'Dil',
            type: 'text',
            admin: { readOnly: true, position: 'sidebar' },
        },
        {
            name: 'lastSeenAt',
            label: 'Son Görülme',
            type: 'date',
            admin: { readOnly: true, position: 'sidebar' },
        },
    ],
    hooks: {
        beforeLogin: [
            ({ user }) => {
                if ((user as { status?: string })?.status === 'blocked') {
                    throw new APIError('Erişiminiz engellenmiştir.', 403)
                }
            },
        ],
        beforeDelete: [preventHardDelete],
    },
}
