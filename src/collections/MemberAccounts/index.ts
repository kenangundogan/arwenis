import type { CollectionConfig } from 'payload'
import { APIError } from 'payload'

import { memberOwnedRead, memberOwnedDelete } from '@/access/collection/memberOwned'

export const MemberAccounts: CollectionConfig = {
    slug: 'member-accounts',
    labels: {
        singular: 'Üye Hesabı',
        plural: 'Üye Hesapları',
    },
    access: {
        create: () => false,
        read: memberOwnedRead('member-accounts'),
        update: () => false,
        delete: memberOwnedDelete('member-accounts'),
    },
    admin: {
        description: 'Bir üyenin bağlı giriş yöntemleri (Google, Apple, ...). Üye birden çok yöntemle giriş yapabilir. Salt okunur — OAuth akışı sunucu tarafında yazar; üye kendi bağlı hesabını kaldırabilir.',
        group: 'Asistan',
        useAsTitle: 'provider',
        defaultColumns: ['provider', 'member', 'providerAccountId', 'createdAt'],
    },
    fields: [
        {
            name: 'member',
            label: 'Üye',
            type: 'relationship',
            relationTo: 'members',
            required: true,
            index: true,
        },
        {
            name: 'provider',
            label: 'Sağlayıcı',
            type: 'select',
            required: true,
            options: [
                { label: 'Google', value: 'google' },
                { label: 'Apple', value: 'apple' },
            ],
        },
        {
            name: 'providerAccountId',
            label: 'Sağlayıcı Hesap ID (sub)',
            type: 'text',
            required: true,
            index: true,
            admin: { description: 'Sağlayıcının verdiği benzersiz kullanıcı kimliği (OAuth "sub").' },
        },
    ],
    hooks: {
        beforeValidate: [
            async ({ data, req, originalDoc }) => {
                if (!data) return data
                const provider = data.provider ?? originalDoc?.provider
                const providerAccountId = data.providerAccountId ?? originalDoc?.providerAccountId
                if (provider && providerAccountId) {
                    const found = await req.payload.find({
                        collection: 'member-accounts',
                        where: {
                            and: [
                                { provider: { equals: provider } },
                                { providerAccountId: { equals: providerAccountId } },
                            ],
                        },
                        limit: 1,
                        depth: 0,
                        overrideAccess: true,
                    })
                    const clash = found.docs.find((d) => String(d.id) !== String(originalDoc?.id))
                    if (clash) throw new APIError('Bu sağlayıcı hesabı zaten bağlı.', 409)
                }
                return data
            },
        ],
    },
}
