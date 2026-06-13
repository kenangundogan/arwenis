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

export const Countries: CollectionConfig<'countries'> = {
    slug: 'countries',
    trash: true,
    labels: {
        singular: 'Ülke',
        plural: 'Ülkeler',
    },
    access: {
        create: canCreate('countries'),
        read: canRead('countries'),
        readVersions: canReadVersions('countries'),
        update: canUpdate('countries'),
        delete: canDelete('countries'),
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
                description: 'Sayfa başlığı (Ülke adı)',
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
                description: 'Sayfa açıklaması (Ülke açıklaması)',
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
