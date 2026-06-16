import type { CollectionConfig } from 'payload'

import { canDelete } from '@/access'
import { memberOwnedRead } from '@/access/collection/memberOwned'
import { sessionFields } from './sessionFields'

export const MemberLoginSessions: CollectionConfig = {
    slug: 'member-login-sessions',
    labels: {
        singular: 'Üye Giriş Kaydı',
        plural: 'Üye Giriş Kayıtları',
    },
    access: {
        create: () => false,
        read: memberOwnedRead('member-login-sessions'),
        update: () => false,
        delete: canDelete('member-login-sessions'),
    },
    admin: {
        group: 'Güvenlik',
        useAsTitle: 'ipAddress',
        defaultColumns: ['member', 'ipAddress', 'browser', 'os', 'deviceType', 'createdAt'],
        listSearchableFields: ['ipAddress', 'userAgent', 'browser', 'os'],
        description:
            'Üyelerin her başarılı girişinde kaydedilen oturum bilgisi. Salt okunur; üye yalnız kendi kayıtlarını görür, yönetici tümünü görür.',
    },
    fields: [
        {
            name: 'member',
            label: 'Üye',
            type: 'relationship',
            relationTo: 'members',
            required: true,
            index: true,
            admin: { readOnly: true, description: 'Giriş yapan üye.' },
        },
        ...sessionFields,
    ],
}
