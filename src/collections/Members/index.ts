import type { CollectionConfig } from 'payload'
import { APIError } from 'payload'

import { canReadSecure, canDelete, adminOnlyField } from '@/access'
import { memberSelfUpdate, notMemberField } from '@/access/collection/memberOwned'
import { preventHardDelete } from '@/access/collection/preventHardDelete'
import {
    composeValidators,
    onlyText,
    minLength,
    maxLength,
    phone,
    generalText,
} from '@/utilities/validators'

export const Members: CollectionConfig = {
    slug: 'members',
    labels: {
        singular: 'Üye',
        plural: 'Üyeler',
    },
    auth: {
        tokenExpiration: 60 * 60 * 24 * 30,
        maxLoginAttempts: 5,
        lockTime: 10 * 60 * 1000,
        cookies: { sameSite: 'Lax' },
    },
    access: {
        create: () => true,
        read: canReadSecure('members'),
        update: memberSelfUpdate('members'),
        delete: canDelete('members'),
    },
    admin: {
        description: 'Asistan son kullanıcıları (üyeler). Admin kullanıcılarından tamamen ayrı; kendi giriş sistemiyle kayıt olur. Bağlı giriş yöntemleri "Üye Hesapları"nda tutulur.',
        group: 'Asistan',
        useAsTitle: 'email',
        defaultColumns: ['email', 'firstName', 'lastName', 'status', 'createdAt'],
        listSearchableFields: ['email', 'firstName', 'lastName'],
    },
    trash: true,
    fields: [
        {
            name: 'email',
            label: 'E-posta',
            type: 'email',
            required: true,
            unique: true,
            index: true,
            access: { update: notMemberField },
        },
        {
            name: 'password',
            type: 'text',
            hidden: true,
            access: { update: notMemberField },
        },
        {
            name: 'status',
            label: 'Durum',
            type: 'select',
            required: true,
            defaultValue: 'active',
            options: [
                { label: 'Aktif', value: 'active' },
                { label: 'Engelli', value: 'blocked' },
            ],
            access: { create: adminOnlyField, update: notMemberField },
            admin: { position: 'sidebar', description: 'Engelli üye giriş yapamaz (yalnız yönetici değiştirir).' },
        },
        {
            name: 'locale',
            label: 'Dil',
            type: 'text',
            admin: { position: 'sidebar', description: 'Üyenin tercih ettiği dil (örn. tr).' },
        },
        {
            name: 'lastSeenAt',
            label: 'Son Görülme',
            type: 'date',
            access: { create: adminOnlyField, update: notMemberField },
            admin: { readOnly: true, position: 'sidebar' },
        },
        {
            type: 'tabs',
            tabs: [
                {
                    label: 'Genel',
                    fields: [
                        {
                            name: 'firstName',
                            label: 'Ad',
                            type: 'text',
                            validate: composeValidators(onlyText(), minLength(2), maxLength(50)),
                            admin: { placeholder: 'Örn. Kenan', description: 'Üyenin adı.' },
                        },
                        {
                            name: 'lastName',
                            label: 'Soyad',
                            type: 'text',
                            validate: composeValidators(onlyText(), minLength(2), maxLength(50)),
                            admin: { placeholder: 'Örn. Gündoğan', description: 'Üyenin soyadı.' },
                        },
                        {
                            name: 'birthDate',
                            label: 'Doğum Tarihi',
                            type: 'date',
                            admin: {
                                description: 'Üyenin doğum tarihi (opsiyonel).',
                                date: { pickerAppearance: 'dayOnly', displayFormat: 'd MMMM yyyy' },
                            },
                        },
                    ],
                },
                {
                    label: 'Cinsiyet',
                    fields: [
                        {
                            name: 'gender',
                            label: 'Cinsiyet',
                            type: 'relationship',
                            relationTo: 'genders',
                            admin: { description: 'Üyenin cinsiyeti (opsiyonel).' },
                        },
                    ],
                },
                {
                    label: 'Adres',
                    fields: [
                        {
                            name: 'country',
                            label: 'Ülke',
                            type: 'relationship',
                            relationTo: 'countries',
                            admin: { description: 'Üyenin ülkesi.' },
                        },
                        {
                            name: 'city',
                            label: 'Şehir',
                            type: 'relationship',
                            relationTo: 'cities',
                            admin: { description: 'Üyenin şehri.' },
                        },
                        {
                            name: 'district',
                            label: 'İlçe',
                            type: 'text',
                            validate: composeValidators(onlyText(), minLength(2), maxLength(50)),
                            admin: { placeholder: 'Örn. Beşiktaş', description: 'Üyenin ilçesi.' },
                        },
                        {
                            name: 'address',
                            label: 'Adres',
                            type: 'textarea',
                            validate: composeValidators(generalText(), minLength(2), maxLength(250)),
                            admin: { placeholder: 'Örn. ... Mah. ... Sok. No: 1', description: 'Üyenin açık adresi.' },
                        },
                    ],
                },
                {
                    label: 'İletişim',
                    fields: [
                        {
                            name: 'gsm',
                            label: 'Cep Telefonu',
                            type: 'text',
                            validate: composeValidators(phone()),
                            admin: { placeholder: 'Örn. 0555 555 55 55', description: 'Üyenin cep telefonu.' },
                        },
                        {
                            name: 'landline',
                            label: 'Sabit Telefon',
                            type: 'text',
                            validate: composeValidators(phone()),
                            admin: { placeholder: 'Örn. 0212 555 55 55', description: 'Üyenin sabit telefonu.' },
                        },
                    ],
                },
                {
                    label: 'Avatar',
                    fields: [
                        {
                            name: 'avatar',
                            label: 'Profil Görseli',
                            type: 'upload',
                            relationTo: 'media',
                            admin: { description: 'Üyenin profil görseli (opsiyonel).' },
                        },
                    ],
                },
                {
                    label: 'Bağlı Hesaplar',
                    description: 'Üyenin giriş yöntemleri (e-posta/şifre dışındaki bağlı sağlayıcılar — Google, Apple). Salt görüntüleme; OAuth akışı yazar.',
                    fields: [
                        {
                            name: 'accounts',
                            label: 'Bağlı Hesaplar',
                            type: 'join',
                            collection: 'member-accounts',
                            on: 'member',
                            admin: { defaultColumns: ['provider', 'providerAccountId', 'createdAt'] },
                        },
                    ],
                },
                {
                    label: 'Asistan Verileri',
                    description: 'Bu üyeye ait sohbet kayıtları (salt görüntüleme). Mesajlar ilgili konuşmanın içinde görünür.',
                    fields: [
                        {
                            name: 'conversations',
                            label: 'Konuşmalar',
                            type: 'join',
                            collection: 'conversations',
                            on: 'member',
                            defaultSort: '-lastMessageAt',
                            admin: { defaultColumns: ['title', 'status', 'messageCount', 'lastMessageAt'] },
                        },
                        {
                            name: 'memory',
                            label: 'Hafıza',
                            type: 'join',
                            collection: 'memory',
                            on: 'member',
                            defaultSort: '-createdAt',
                            admin: { defaultColumns: ['text', 'createdAt'] },
                        },
                        {
                            name: 'folders',
                            label: 'Klasörler',
                            type: 'join',
                            collection: 'folders',
                            on: 'member',
                            defaultSort: '-createdAt',
                            admin: { defaultColumns: ['name', 'createdAt'] },
                        },
                    ],
                },
            ],
        },
    ],
    hooks: {
        beforeLogin: [
            ({ user }) => {
                if ((user as { status?: string })?.status === 'blocked') {
                    throw new APIError('Erişiminiz engellenmiştir.', 403)
                }
            },
        ],
        beforeDelete: [preventHardDelete],
    },
}
