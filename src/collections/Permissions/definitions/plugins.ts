import type { Field } from 'payload'
import { scopeField, collectionActionsField } from '@/fields/permission'

// Plugin koleksiyonları için yetkilendirme tanımları
export const pluginCollections = [
    {
        slug: 'forms',
        label: 'Formlar',
    },
    {
        slug: 'formSubmissions',
        label: 'Form Gönderimleri',
    },
    {
        slug: 'redirects',
        label: 'Yönlendirmeler',
    },
    {
        slug: 'searches',
        label: 'Arama Sonuçları',
    },
    {
        slug: 'imports',
        label: 'İçe Aktarmalar',
    },
    {
        slug: 'exports',
        label: 'Dışa Aktarmalar',
    },
]

export const pluginsGroup: Field[] = pluginCollections.map((collection) => ({
    label: collection.label,
    type: 'collapsible',
    fields: [
        {
            name: collection.slug,
            type: 'group',
            fields: [
                scopeField,
                collectionActionsField,
            ],
        },
    ],
    admin: {
        initCollapsed: true,
    },
}))
