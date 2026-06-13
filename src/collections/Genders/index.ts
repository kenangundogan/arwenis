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
            validate: composeValidators(
                required(),
                minLength(2),
                maxLength(50),
                onlyText(),
            ),
            admin: {
                description: 'Sayfa başlığı (Cinsiyet adı)',
            },
        },
        {
            label: 'Açıklama',
            name: 'description',
            type: 'text',
            required: true,
            validate: composeValidators(
                required(),
                minLength(5),
                maxLength(160),
                generalText()
            ),
            admin: {
                description: 'Sayfa açıklaması (Cinsiyet açıklaması)',
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
