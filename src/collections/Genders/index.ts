import type { CollectionConfig } from 'payload'

import { auditFields } from '@/fields/auditFields'
import { createCollectionFieldHook } from '@/utilities/createFieldHook'
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
    minLength,
    maxLength,
    onlyText,
    generalText
} from '@/utilities/validators'

export const Genders: CollectionConfig<'genders'> = {
    slug: 'genders',
    trash: true,
    labels: {
        singular: 'Cinsiyet',
        plural: 'Cinsiyetler',
    },
    access: {
        create: canCreate('genders'),
        read: canRead('genders'),
        readVersions: canReadVersions('genders'),
        update: canUpdate('genders'),
        delete: canDelete('genders'),
    },
    defaultPopulate: {
        title: true,
        slug: true,
        description: true
    },
    admin: {
        defaultColumns: ['title', 'slug', 'updatedAt'],
        group: 'Kullanıcı Yönetimi',
        useAsTitle: 'title',
    },
    fields: [
        {
            label: 'Başlık',
            name: 'title',
            type: 'text',
            required: true,
            unique: true,
            localized: true,
            validate: composeValidators(
                required(),
                minLength(2),
                maxLength(50),
                onlyText(),
            ),
            admin: {
                description: 'Cinsiyet adı (dile göre — örn. Erkek / Male)',
            },
        },
        {
            label: 'Açıklama',
            name: 'description',
            type: 'text',
            localized: true,
            validate: composeValidators(
                maxLength(160),
                generalText()
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
                readOnly: true,
                position: 'sidebar',
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
