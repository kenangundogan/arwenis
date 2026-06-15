import type { CollectionConfig } from 'payload'

import { createCollectionFieldHook } from '@/utilities/createFieldHook'
import { auditFields } from '@/fields/auditFields'
import { preventHardDelete } from '@/access/collection/preventHardDelete'
import {
    canCreate,
    canUpdate,
    canDelete,
    canReadSecure,
    canReadVersions,
} from '@/access'
import {
    composeValidators,
    required,
    generalText,
    minLength,
    maxLength
} from '@/utilities/validators'

export const Roles: CollectionConfig<'roles'> = {
    slug: 'roles',
    trash: true,
    labels: {
        singular: 'Rol',
        plural: 'Roller',
    },
    access: {
        create: canCreate('roles'),
        read: canReadSecure('roles'),
        readVersions: canReadVersions('roles'),
        update: canUpdate('roles'),
        delete: canDelete('roles'),
    },
    defaultPopulate: {
        title: true,
        slug: true,
        description: true,
        permissions: true,
    },
    admin: {
        description: 'Sistem rolleri (admin = süper yetkili). Kullanıcılara atanır; ince yetkiler İzinler koleksiyonunda.',
        defaultColumns: ['title', 'slug', 'permissions', 'updatedAt'],
        group: 'Kullanıcı Yönetimi',
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
                description: 'Sayfa başlığı (Rol adı)',
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
                description: 'Sayfa açıklaması (Rol açıklaması)',
            },
        },
        {
            label: 'İzinler',
            name: 'permissions',
            type: 'select',
            hasMany: true,
            required: true,
            admin: {
                description:
                    'Bilgilendirme amaçlı etiket. Gerçek yetkilendirme "Permissions" koleksiyonundaki kullanıcı kayıtları üzerinden uygulanır.',
            },
            options: [
                {
                    label: 'Create',
                    value: 'create',
                },
                {
                    label: 'Read',
                    value: 'read',
                },
                {
                    label: 'Update',
                    value: 'update',
                },
                {
                    label: 'Delete',
                    value: 'delete',
                },
            ],
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

            schedulePublish: true,
        },
        maxPerDoc: 50,
    },
}
