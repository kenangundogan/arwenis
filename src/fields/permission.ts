import type { Field } from 'payload'

export const scopeField: Field = {
    name: 'scope',
    label: 'Erişim Kapsamı',
    type: 'select',
    options: [
        { label: 'Erişim Yok', value: 'none' },
        { label: 'Sadece Kendi Verileri', value: 'own' },
        { label: 'Tüm Veriler', value: 'all' },
    ],
    defaultValue: 'none',
    required: true,
}

export const collectionActionsField: Field = {
    name: 'actions',
    label: 'İzinler',
    type: 'select',
    hasMany: true,
    required: true,
    options: [
        { label: 'Oluştur', value: 'create' },
        { label: 'Oku', value: 'read' },
        { label: 'Güncelle', value: 'update' },
        { label: 'Sil', value: 'delete' },
        { label: 'Yayınla', value: 'publish' },
        { label: 'Kalıcı Sil', value: 'hardDelete' },
        { label: 'Versiyonları Oku', value: 'readVersions' },
    ],
    admin: {
        condition: (_, siblingData) => siblingData?.scope !== 'none',
    },
}

export const globalActionsField: Field = {
    name: 'actions',
    label: 'İzinler',
    type: 'select',
    hasMany: true,
    required: true,
    defaultValue: ['none'],
    options: [
        { label: 'Erişim Yok', value: 'none' },
        { label: 'Görüntüle', value: 'read' },
        { label: 'Güncelle', value: 'update' },
        { label: 'Versiyonları Oku', value: 'readVersions' },
    ],
    admin: {
        description: 'Kullanıcının yapabileceği işlemler',
    },
}
