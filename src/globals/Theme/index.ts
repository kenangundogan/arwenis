import type { GlobalConfig } from 'payload'

import { auditFields } from '@/fields/auditFields'
import { canReadGlobal, canUpdateGlobal, canReadVersionsGlobal } from '@/access'
import {
    composeValidators,
    required,
    generalText,
    alphaNumeric,
    minLength,
    maxLength,
    matches,
} from '@/utilities/validators'
import { revalidateTheme } from './hooks/revalidateTheme'

export const Theme: GlobalConfig = {
    slug: 'theme',
    label: 'Tema',
    access: {
        read: canReadGlobal('theme'),
        readVersions: canReadVersionsGlobal('theme'),
        update: canUpdateGlobal('theme'),
    },
    admin: {
        group: 'Ayarlar',
    },
    fields: [
        {
            name: 'name',
            label: 'Asistan Adı',
            type: 'text',
            required: true,
            defaultValue: 'Arwenis',
            validate: composeValidators(required(), generalText(), minLength(2), maxLength(50)),
            admin: { description: 'Markaya özel asistan adı (frontend başlık + sekmeler)' },
        },
        {
            name: 'brandColor',
            label: 'Marka Rengi',
            type: 'text',
            defaultValue: '#4f46e5',
            validate: composeValidators(
                matches(/^#([0-9a-fA-F]{6})$/, 'Geçerli bir hex renk kodu giriniz (örn. #4f46e5).'),
            ),
            admin: { description: 'Tema ana rengi (--brand CSS değişkenine yansır)' },
        },
        {
            name: 'logo',
            type: 'upload',
            relationTo: 'media',
            label: 'Site Logosu',
            filterOptions: { mimeType: { in: ['image/svg+xml'] } },
            admin: { description: 'Site genelinde kullanılacak ana logo (SVG önerilir)' },
        },
        {
            name: 'logoAlt',
            label: 'Logo Alt Text',
            type: 'text',
            defaultValue: 'Arwenis',
            required: true,
            validate: composeValidators(alphaNumeric(), minLength(1), maxLength(100)),
            admin: { description: 'Logo açıklaması (alt text)' },
        },
        {
            type: 'collapsible',
            label: 'Favicon',
            admin: { initCollapsed: true },
            fields: [
                {
                    name: 'favicon',
                    type: 'upload',
                    relationTo: 'media',
                    label: 'Favicon (ICO)',
                    filterOptions: { mimeType: { in: ['image/x-icon'] } },
                    admin: { description: 'Site faviconı (.ico, 32x32 veya 16x16)' },
                },
                {
                    name: 'faviconSvg',
                    type: 'upload',
                    relationTo: 'media',
                    label: 'Favicon SVG',
                    filterOptions: { mimeType: { in: ['image/svg+xml'] } },
                    admin: { description: 'Modern tarayıcılar için SVG favicon' },
                },
            ],
        },
        ...auditFields,
    ],
    hooks: {
        afterChange: [revalidateTheme],
    },
    versions: {
        drafts: { schedulePublish: true },
    },
}
