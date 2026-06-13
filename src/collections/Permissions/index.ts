import type { CollectionConfig } from 'payload'
import { adminOnly } from '@/access'
import { auditFields } from '@/fields/auditFields'
import { collectionsGroup } from './definitions/collections'
import { globalsGroup } from './definitions/globals'
import { pluginsGroup } from './definitions/plugins'
import { widgetsGroup } from './definitions/widgets'

export const Permissions: CollectionConfig = {
    slug: 'permissions',
    labels: {
        singular: 'Kullanıcı Yetkisi',
        plural: 'Kullanıcı Yetkileri',
    },
    access: {
        create: adminOnly,
        read: adminOnly,
        update: adminOnly,
        delete: adminOnly,
    },
    admin: {
        group: 'Kullanıcı Yönetimi',
        defaultColumns: ['user', 'updatedAt'],
        useAsTitle: 'user',
        description: 'Kullanıcı yetkilerini yönetin - Her kullanıcı için tek kayıt',
    },
    fields: [
        {
            name: 'user',
            label: 'Kullanıcı',
            type: 'relationship',
            relationTo: 'users',
            required: true,
            unique: true,
            hasMany: false,
            index: true,
            admin: {
                description: 'Yetkilerin atanacağı kullanıcı',
                width: '50%',
            },
        },
        {
            name: 'isActive',
            label: 'Aktif',
            type: 'checkbox',
            defaultValue: true,
            admin: {
                description: 'Tüm yetkileri geçici olarak devre dışı bırakabilirsiniz',
                width: '50%',
                style: {
                    alignSelf: 'flex-end',
                }
            },
        },
        ...collectionsGroup,
        ...globalsGroup,
        ...pluginsGroup,
        ...widgetsGroup,
        ...auditFields,
    ],
}

