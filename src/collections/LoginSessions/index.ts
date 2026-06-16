import type { CollectionConfig } from 'payload'

import { canReadSecure, canDelete } from '@/access'
import { sessionFields } from './sessionFields'

export const LoginSessions: CollectionConfig = {
    slug: 'login-sessions',
    labels: {
        singular: 'Yönetici Giriş Kaydı',
        plural: 'Yönetici Giriş Kayıtları',
    },
    access: {
        create: () => false,
        read: canReadSecure('login-sessions'),
        update: () => false,
        delete: canDelete('login-sessions'),
    },
    admin: {
        group: 'Güvenlik',
        useAsTitle: 'ipAddress',
        defaultColumns: ['user', 'ipAddress', 'browser', 'os', 'deviceType', 'createdAt'],
        listSearchableFields: ['ipAddress', 'userAgent', 'browser', 'os'],
        description:
            'Yönetim paneli (admin) kullanıcılarının her başarılı girişinde kaydedilen oturum bilgisi. Salt okunur, yalnız yöneticiler görür.',
    },
    fields: [
        {
            name: 'user',
            label: 'Yönetici',
            type: 'relationship',
            relationTo: 'users',
            required: true,
            index: true,
            admin: { readOnly: true, description: 'Giriş yapan admin kullanıcısı.' },
        },
        ...sessionFields,
    ],
}
