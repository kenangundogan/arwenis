import type { CollectionConfig } from 'payload'

import { canCreate, canUpdate, canDelete } from '@/access'

export const Media: CollectionConfig = {
    slug: 'media',
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
        group: 'İçerik',
    },
    fields: [
        {
            name: 'alt',
            label: 'Alternatif Metin',
            type: 'text',
            required: true,
            admin: { description: 'Görselin erişilebilirlik açıklaması (alt text)' },
        },
    ],
    upload: true,
}
