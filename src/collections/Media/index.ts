import type { CollectionConfig } from 'payload'

import { canCreate, canUpdate, canDelete } from '@/access'
import { composeValidators, required, generalText, minLength, maxLength } from '@/utilities/validators'

export const Media: CollectionConfig = {
    slug: 'media',
    trash: true,
    labels: {
        singular: 'Medya',
        plural: 'Medya',
    },
    access: {
        read: () => true,
        create: canCreate('media'),
        update: canUpdate('media'),
        delete: canDelete('media'),
    },
    admin: {
        description: 'Yüklenen görsel ve dosyalar. Okuma herkese açık; yazma yetkiye bağlı.',
        group: 'İçerik',
        defaultColumns: ['filename', 'alt', 'updatedAt'],
        listSearchableFields: ['filename', 'alt'],
        useAsTitle: 'filename',
    },
    fields: [
        {
            name: 'alt',
            label: 'Alternatif Metin',
            type: 'text',
            required: true,
            validate: composeValidators(required(), generalText(), minLength(2), maxLength(100)),
            admin: { description: 'Görselin erişilebilirlik açıklaması (alt text)' },
        },
    ],
    upload: {
        adminThumbnail: 'thumbnail',
        focalPoint: true,
        mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'],
        imageSizes: [
            { name: 'thumbnail', width: 96 },
            { name: 'small', width: 640 },
        ].map((size) => ({
            ...size,
            generateImageName: ({ originalName, sizeName, extension }) => {
                const nameWithoutExtension = originalName.replace(`.${extension}`, '')
                return `${nameWithoutExtension}-${sizeName}.${extension}`
            },
        })),
    },
}
