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
    maxLength,
    matches,
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
        country: true,
        plateCode: true,
    },
    admin: {
        defaultColumns: ['title', 'country', 'plateCode', 'slug', 'updatedAt'],
        group: 'Coğrafya Yönetimi',
        useAsTitle: 'title',
    },
    fields: [
        {
            label: 'Başlık',
            name: 'title',
            type: 'text',
            required: true,
            localized: true,
            validate: composeValidators(
                required(),
                generalText(),
                minLength(2),
                maxLength(50)
            ),
            admin: {
                description: 'Şehir adı (dile göre — örn. İstanbul / Istanbul)',
            },
        },
        {
            type: 'row',
            fields: [
                {
                    label: 'Ülke',
                    name: 'country',
                    type: 'relationship',
                    relationTo: 'countries',
                    required: true,
                    index: true,
                    admin: {
                        width: '50%',
                        description: 'Şehrin bağlı olduğu ülke',
                    },
                },
                {
                    label: 'Plaka Kodu',
                    name: 'plateCode',
                    type: 'text',
                    validate: composeValidators(
                        matches(/^\d{1,2}$/, 'Geçerli bir plaka kodu giriniz (örn. 34).'),
                    ),
                    admin: {
                        width: '50%',
                        placeholder: 'Örn. 34',
                        description: 'İl plaka kodu (opsiyonel — TR için)',
                    },
                },
            ],
        },
        {
            label: 'Açıklama',
            name: 'description',
            type: 'text',
            localized: true,
            validate: composeValidators(
                generalText(),
                maxLength(160)
            ),
            admin: {
                description: 'Opsiyonel açıklama',
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
                onlyOnCreate: true,
            }),
        ],
    },
    versions: {
        drafts: {

            schedulePublish: true,
        },
        maxPerDoc: 50,
    },
}
