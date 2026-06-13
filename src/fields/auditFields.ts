import type { Field } from 'payload'

/**
 * Audit Fields
 *
 * İçeriğin kim tarafından oluşturulduğu ve güncellendiği bilgisini tutar.
 * Her collection'da kullanılabilir.
 *
 * GÜVENLİK: createdBy ve updatedBy sadece authenticated kullanıcılar tarafından görülebilir.
 * Public API'de bu alanlar görünmez.
 */
export const auditFields: Field[] = [
    {
        label: 'Oluşturan',
        name: 'createdBy',
        type: 'relationship',
        relationTo: 'users',
        access: {
            // Sadece authenticated (giriş yapmış) kullanıcılar görebilir
            read: ({ req: { user } }) => !!user,
        },
        admin: {
            position: 'sidebar',
            readOnly: true,
            description: 'Bu içeriği oluşturan kullanıcı',
        },
        hooks: {
            beforeChange: [
                async ({ req, value, operation }) => {
                    // Sadece create işleminde, user varsa ve henüz değer atanmamışsa
                    if (operation === 'create' && req.user && !value) {
                        return req.user.id
                    }
                    return value
                },
            ],
        },
    },
    {
        label: 'Güncelleyen',
        name: 'updatedBy',
        type: 'relationship',
        relationTo: 'users',
        access: {
            // Sadece authenticated (giriş yapmış) kullanıcılar görebilir
            read: ({ req: { user } }) => !!user,
        },
        admin: {
            position: 'sidebar',
            readOnly: true,
            description: 'Bu içeriği güncelleyen son kullanıcı',
        },
        hooks: {
            beforeChange: [
                async ({ req, operation }) => {
                    // Her create ve update işleminde kullanıcı bilgisini kaydet
                    if ((operation === 'create' || operation === 'update') && req.user) {
                        return req.user.id
                    }
                },
            ],
        },
    },
]
