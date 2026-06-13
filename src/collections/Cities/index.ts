import type { CollectionConfig } from 'payload'

import { createCollectionFieldHook } from '@/utilities/createFieldHook'
import { auditFields } from '@/fields/auditFields'
import { preventHardDelete } from '@/access/collection/preventHardDelete'
import {
    canCreate,
    canUpdate,
    canDelete,
    canRead,
    canReadVersions,
} from '@/access'
import {
    composeValidators,
    required,
    generalText,
    minLength,
    maxLength
} from '@/utilities/validators'

export const Cities: CollectionConfig<'cities'> = {
    slug: 'cities',
    trash: true,
    labels: {
        singular: 'Şehir',
        plural: 'Şehirler',
    },
    access: {
        create: canCreate('cities'),
        read: canRead('cities'),
        readVersions: canReadVersions('cities'),
        update: canUpdate('cities'),
        delete: canDelete('cities'),
    },
    defaultPopulate: {
        title: true,
        slug: true,
        description: true
    },
    admin: {
        defaultColumns: ['title', 'slug', 'updatedAt'],
        group: 'Coğrafya Yönetimi',
        useAsTitle: 'title',
    },
    fields: [
        {
            label: 'Başlık',
            name: 'title',
            type: 'text',
            required: true,
            validate: composeValidators(
                required(),
                generalText(),
                minLength(2),
                maxLength(50)
            ),
            admin: {
                description: 'Sayfa başlığı (Şehir adı)',
            },
        },
        {
            label: 'Açıklama',
            name: 'description',
            type: 'text',
            required: true,
            validate: composeValidators(
                required(),
                generalText(),
                minLength(2),
                maxLength(160)
            ),
            admin: {
                description: 'Sayfa açıklaması (Şehir açıklaması)',
            },
        },
        {
            label: 'Slug',
            name: 'slug',
            type: 'text',
            required: true,
            unique: true,
            index: true,
            admin: {
                position: 'sidebar',
                readOnly: true,
                description: 'Sayfa URL\'sinde kullanılacak benzersiz tanımlayıcı',
            },
        },
        ...auditFields,
    ],
    hooks: {
        beforeDelete: [preventHardDelete],
        beforeValidate: [
            createCollectionFieldHook({
                source: [{ field: 'title' }],
                target: 'slug',
                transform: 'slugify',
            }),
        ],
    },
    versions: {
        drafts: {
            // autosave: {
            //   interval: 100,
            // },
            schedulePublish: true,
        },
        maxPerDoc: 50,
    },
}
