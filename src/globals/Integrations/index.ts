import type { GlobalConfig } from 'payload'

import { auditFields } from '@/fields/auditFields'
import { canReadGlobal, canUpdateGlobal, canReadVersionsGlobal, adminOnlyField } from '@/access'

const secretAccess = { read: adminOnlyField, update: adminOnlyField }

export const Integrations: GlobalConfig = {
    slug: 'integrations',
    label: 'Entegrasyonlar',
    access: {
        read: canReadGlobal('integrations'),
        readVersions: canReadVersionsGlobal('integrations'),
        update: canUpdateGlobal('integrations'),
    },
    admin: {
        group: 'Ayarlar',
    },
    fields: [
        {
            name: 'google',
            type: 'group',
            label: 'Google ile Giriş (OAuth)',
            admin: { description: 'Yönlendirme URI: <site>/api/assistant/auth/google/callback' },
            fields: [
                {
                    name: 'enabled',
                    label: 'Aktif',
                    type: 'checkbox',
                    defaultValue: false,
                    admin: { description: 'İşaretliyse giriş ekranında "Google ile devam et" görünür (credential dolu olmalı).' },
                },
                {
                    name: 'clientId',
                    label: 'Client ID',
                    type: 'text',
                    admin: { description: 'Google Cloud Console → OAuth 2.0 Client ID', condition: (_, sib) => sib?.enabled },
                },
                {
                    name: 'clientSecret',
                    label: 'Client Secret',
                    type: 'text',
                    access: secretAccess,
                    admin: { description: '🔒 Gizli', condition: (_, sib) => sib?.enabled },
                },
            ],
        },
        {
            name: 'apple',
            type: 'group',
            label: 'Apple ile Giriş (OAuth)',
            admin: { description: 'Apple ile giriş entegrasyonu (yakında).' },
            fields: [
                {
                    name: 'enabled',
                    label: 'Aktif',
                    type: 'checkbox',
                    defaultValue: false,
                    admin: { description: 'İşaretliyse giriş ekranında "Apple ile devam et" görünür (credential dolu olmalı).' },
                },
                {
                    name: 'clientId',
                    label: 'Service ID (Client ID)',
                    type: 'text',
                    admin: { description: 'Apple Developer → Identifiers → Services ID', condition: (_, sib) => sib?.enabled },
                },
                {
                    name: 'teamId',
                    label: 'Team ID',
                    type: 'text',
                    admin: { condition: (_, sib) => sib?.enabled },
                },
                {
                    name: 'keyId',
                    label: 'Key ID',
                    type: 'text',
                    admin: { condition: (_, sib) => sib?.enabled },
                },
                {
                    name: 'privateKey',
                    label: 'Private Key (.p8)',
                    type: 'textarea',
                    access: secretAccess,
                    admin: { description: '🔒 Gizli — .p8 anahtar içeriği', condition: (_, sib) => sib?.enabled },
                },
            ],
        },
        {
            name: 'recaptcha',
            type: 'group',
            label: 'reCAPTCHA v3',
            admin: { description: 'Bot koruması (giriş/kayıt). Site Key publictir; Secret Key gizli.' },
            fields: [
                {
                    name: 'enabled',
                    label: 'Aktif',
                    type: 'checkbox',
                    defaultValue: false,
                },
                {
                    name: 'siteKey',
                    label: 'Site Key',
                    type: 'text',
                    admin: { description: 'Public (frontend\'de kullanılır)', condition: (_, sib) => sib?.enabled },
                },
                {
                    name: 'secretKey',
                    label: 'Secret Key',
                    type: 'text',
                    access: secretAccess,
                    admin: { description: '🔒 Gizli (sunucu doğrulaması)', condition: (_, sib) => sib?.enabled },
                },
                {
                    name: 'minScore',
                    label: 'Min. Skor',
                    type: 'number',
                    defaultValue: 0.5,
                    min: 0,
                    max: 1,
                    admin: { step: 0.1, description: 'v3 skor eşiği (altı bot sayılır)', condition: (_, sib) => sib?.enabled },
                },
            ],
        },
        ...auditFields,
    ],
    versions: {
        drafts: { schedulePublish: true },
    },
}
