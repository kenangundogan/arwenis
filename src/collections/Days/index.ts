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

export const Days: CollectionConfig<'days'> = {
    slug: 'days',
    trash: true,
    labels: {
        singular: 'Gün',
        plural: 'Günler',
    },
    access: {
        create: canCreate('days'),
        read: canRead('days'),
        readVersions: canReadVersions('days'),
        update: canUpdate('days'),
        delete: canDelete('days'),
    },
    defaultPopulate: {
        title: true,
        slug: true,
        dayIndex: true,
    },
    defaultSort: 'dayIndex',
    admin: {
        defaultColumns: ['dayIndex', 'title', 'slug', 'updatedAt'],
        group: 'Tanımlar',
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
                description: 'Gün adı (dile göre — örn. Pazartesi / Monday)',
            },
        },
        {
            label: 'Gün Sırası',
            name: 'dayIndex',
            type: 'number',
            required: true,
            unique: true,
            index: true,
            min: 0,
            max: 6,
            admin: {
                step: 1,
                placeholder: 'Örn. 0',
                description: 'Haftanın günü sırası: 0 = Pazartesi … 6 = Pazar (dil-bağımsız sıralama)',
            },
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
