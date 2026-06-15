import type { CollectionConfig } from 'payload'

import { isMember } from '@/access/utils'
import {
    memberOwnedRead,
    memberOwnedUpdate,
    memberOwnedDelete,
    memberCreate,
    notMemberField,
} from '@/access/collection/memberOwned'

export const Folders: CollectionConfig = {
    slug: 'folders',
    labels: {
        singular: 'Klasör',
        plural: 'Klasörler',
    },
    access: {
        create: memberCreate,
        read: memberOwnedRead('folders'),
        update: memberOwnedUpdate,
        delete: memberOwnedDelete('folders'),
    },
    admin: {
        description: 'Üyelerin sohbetlerini grupladığı klasörler. Salt okunur — üye tarafında oluşturulur.',
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
            access: { update: notMemberField },
        },
        {
            name: 'name',
            label: 'Ad',
            type: 'text',
            required: true,
        },
    ],
    hooks: {
        beforeValidate: [
            ({ data, req, operation }) => {
                if (operation === 'create' && data && isMember(req.user)) {
                    data.member = req.user!.id
                }
                return data
            },
        ],
        afterDelete: [
            async ({ req, id }) => {
                await req.payload.update({
                    collection: 'conversations',
                    where: { folder: { equals: id } },
                    data: { folder: null },
                    overrideAccess: true,
                })
            },
        ],
    },
}
