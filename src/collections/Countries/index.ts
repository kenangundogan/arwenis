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
    isoCountryCodeValidator,
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
        iso2: true,
        dialCode: true,
    },
    admin: {
        defaultColumns: ['title', 'iso2', 'dialCode', 'slug', 'updatedAt'],
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
                description: 'Ülke adı (dile göre — örn. Türkiye / Turkey)',
            },
        },
        {
            type: 'row',
            fields: [
                {
                    label: 'ISO Kodu (alpha-2)',
                    name: 'iso2',
                    type: 'text',
                    required: true,
                    unique: true,
                    index: true,
                    validate: composeValidators(
                        required(),
                        isoCountryCodeValidator(),
                    ),
                    admin: {
                        width: '50%',
                        placeholder: 'Örn. TR',
                        description: '2 harfli ISO 3166-1 ülke kodu (büyük harf)',
                    },
                },
                {
                    label: 'Telefon Kodu',
                    name: 'dialCode',
                    type: 'text',
                    validate: composeValidators(
                        matches(/^\+\d{1,4}$/, 'Geçerli bir telefon kodu giriniz (örn. +90).'),
                    ),
                    admin: {
                        width: '50%',
                        placeholder: 'Örn. +90',
                        description: 'Uluslararası arama kodu (opsiyonel)',
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
