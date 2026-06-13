import type { CollectionConfig } from 'payload'

import { auditFields } from '@/fields/auditFields'
import { preventHardDelete } from '@/access/collection/preventHardDelete'
import { ensureFirstUserIsAdmin } from './hooks/ensureFirstUserIsAdmin'
import {
    canCreate,
    canUpdate,
    canDelete,
    checkRole,
    selfOrAdminField,
    canReadSecure,
} from '@/access'

import { imagesFields } from '@/fields/images'
import {
    composeValidators,
    required,
    onlyText,
    minLength,
    maxLength,
    email,
    phone,
    generalText,
    passwordValidator
} from '@/utilities/validators'

export const Users: CollectionConfig = {
    auth: {
        tokenExpiration: 3600,
        maxLoginAttempts: 5,
        lockTime: 600 * 1000,
        cookies: {
            secure: process.env.NODE_ENV === 'production',

            sameSite: 'Lax',
        },
    },
    hooks: {
        beforeDelete: [preventHardDelete],
        beforeValidate: [ensureFirstUserIsAdmin],
    },
    slug: 'users',
    trash: true,
    labels: {
        singular: 'Kullanıcı',
        plural: 'Kullanıcılar',
    },
    access: {
        admin: ({ req: { user } }) => checkRole(['admin', 'editor', 'author', 'contributor', 'viewer'], user),
        create: canCreate('users'),
        read: canReadSecure('users'),
        update: canUpdate('users'),
        delete: canDelete('users'),
    },
    admin: {
        group: 'Kullanıcı Yönetimi',
        listSearchableFields: ['email', 'general.firstName', 'general.lastName', 'roles', 'updatedAt'],
        defaultColumns: ['email', 'general.firstName', 'general.lastName', 'roles', 'updatedAt'],
        useAsTitle: 'email',
    },
    fields: [
        {
            name: 'email',
            type: 'email',
            required: true,
            validate: composeValidators(
                required(),
                maxLength(50),
                email()
            ),
            unique: true,
            access: {
                read: selfOrAdminField,
            },
        },

        {
            name: 'password',
            type: 'text',
            hidden: true,
            validate: passwordValidator(),
        },

        {
            label: 'Roller',
            name: 'roles',
            type: 'relationship',
            relationTo: 'roles',
            required: true,
            admin: {
                position: 'sidebar',
                description: 'Kullanıcının rollerini seçin.'
            },
            access: {
                read: selfOrAdminField,
            },
        },
        {
            type: 'tabs',
            tabs: [
                {
                    label: 'General',
                    fields: [
                        {
                            label: 'Ad',
                            name: 'firstName',
                            type: 'text',
                            required: true,
                            validate: composeValidators(
                                required(),
                                onlyText(),
                                minLength(2),
                                maxLength(50)
                            ),
                            admin: {
                                placeholder: 'Örn. Kenan',
                                description: 'Kullanıcının ilk adını girin.',
                            },
                        },
                        {
                            label: 'Soyad',
                            name: 'lastName',
                            type: 'text',
                            required: true,
                            validate: composeValidators(
                                required(),
                                onlyText(),
                                minLength(2),
                                maxLength(50)
                            ),
                            admin: {
                                placeholder: 'Örn. Gündoğan',
                                description: 'Kullanıcının soyadını girin.',
                            },
                        },
                        {
                            label: 'Doğum Tarihi',
                            name: 'birthDate',
                            type: 'date',
                            admin: {
                                placeholder: 'Örn. 1988-01-01',
                                description: 'Kullanıcının doğum tarihini girin.',
                                date: {
                                    pickerAppearance: 'dayOnly',
                                    displayFormat: 'd MMMM yyyy',
                                    minDate: new Date('1900-01-01'),
                                    maxDate: new Date(new Date().setFullYear(new Date().getFullYear() - 15)),
                                },
                            },
                            access: {
                                read: selfOrAdminField,
                            },
                        },
                    ],
                },
                {
                    label: 'Cinsiyet',
                    access: {
                        read: selfOrAdminField,
                    },
                    fields: [
                        {
                            label: 'Cinsiyet',
                            name: 'gender',
                            type: 'relationship',
                            relationTo: 'genders',
                            required: true,
                            admin: {
                                placeholder: 'Örn. Erkek',
                                description: 'Kullanıcının cinsiyetini seçin.'
                            },
                        },
                    ],
                },
                {
                    label: 'Adresler',
                    access: {
                        read: selfOrAdminField,
                    },
                    fields: [
                        {
                            label: 'Ülke',
                            name: 'country',
                            type: 'relationship',
                            relationTo: 'countries',
                            admin: {
                                description: 'Kullanıcının ülkesini seçin.'
                            },
                        },
                        {
                            label: 'Şehir',
                            name: 'city',
                            type: 'relationship',
                            relationTo: 'cities',
                            admin: {
                                description: 'Kullanıcının şehrini seçin.'
                            },
                        },
                        {
                            label: 'İlçe',
                            name: 'district',
                            type: 'text',
                            validate: composeValidators(
                                onlyText(),
                                minLength(2),
                                maxLength(50)
                            ),
                            admin: {
                                placeholder: 'Örn. Beşiktaş',
                                description: 'Kullanıcının ilçesini girin.'
                            },
                        },
                        {
                            label: 'Adres',
                            name: 'address',
                            type: 'textarea',
                            validate: composeValidators(
                                generalText(),
                                minLength(2),
                                maxLength(250)
                            ),
                            admin: {
                                placeholder: 'Örn. Beşiktaş Mahallesi, 123. Sokak, No: 1',
                                description: 'Kullanıcının tam adresini girin.'
                            },
                        },
                    ],
                },
                {
                    label: 'Telefon Numaraları',
                    access: {
                        read: selfOrAdminField,
                    },
                    fields: [
                        {
                            name: 'landline',
                            type: 'text',
                            label: 'Sabit Telefon',
                            validate: composeValidators(phone()),
                            admin: {
                                placeholder: 'Örn. 0212 555 55 55',
                                description: 'Kullanıcının sabit telefon numarasını girin.'
                            },
                        },
                        {
                            label: 'Cep Telefonu',
                            name: 'gsm',
                            type: 'text',
                            validate: composeValidators(phone()),
                            admin: {
                                placeholder: 'Örn. 0555 555 55 55',
                                description: 'Kullanıcının cep telefon numarasını girin.'
                            },
                        },
                    ],
                },
                {
                    label: 'Görseller',
                    fields: [imagesFields],
                },
            ],
        },
        ...auditFields,
    ],
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
