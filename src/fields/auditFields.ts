import type { Field } from 'payload'

export const auditFields: Field[] = [
    {
        label: 'Oluşturan',
        name: 'createdBy',
        type: 'relationship',
        relationTo: 'users',
        access: {

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

                    if ((operation === 'create' || operation === 'update') && req.user) {
                        return req.user.id
                    }
                },
            ],
        },
    },
]
