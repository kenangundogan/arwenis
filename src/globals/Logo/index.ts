import type { GlobalConfig } from 'payload'
import { revalidateLogo } from './hooks/revalidateLogo'
import { auditFields } from '@/fields/auditFields'
import {
    canReadGlobal,
    canUpdateGlobal,
    canReadVersionsGlobal,
} from '@/access'
import {
    composeValidators,
    alphaNumeric,
    minLength,
    maxLength,
} from '@/utilities/validators'

export const Logo: GlobalConfig = {
    label: 'Logo',
    slug: 'logo',
    access: {
        read: canReadGlobal('logo'),
        readVersions: canReadVersionsGlobal('logo'),
        update: canUpdateGlobal('logo'),
    },
    admin: {
        group: 'Ayarlar',
    },
    fields: [
        {
            name: 'logo',
            type: 'upload',
            relationTo: 'media',
            label: 'Site Logosu',
            filterOptions: {
                mimeType: { in: ['image/svg+xml'] },
            },
            admin: {
                description: 'Site genelinde kullanılacak ana logo (SVG önerilir)',
            },
        },
        {
            name: 'logoAlt',
            label: 'Logo Alt Text',
            type: 'text',
            defaultValue: 'Arwenis',
            required: true,
            validate: composeValidators(
                alphaNumeric(),
                minLength(1),
                maxLength(100),
            ),
            admin: {
                description: 'Logo açıklaması (alt text)',
            },
        },
        {
            type: 'collapsible',
            label: 'Favicon',
            admin: {
                initCollapsed: true,
            },
            fields: [
                {
                    name: 'favicon',
                    type: 'upload',
                    relationTo: 'media',
                    label: 'Favicon (ICO)',
                    filterOptions: {
                        mimeType: { in: ['image/x-icon'] },
                    },
                    admin: {
                        description: 'Site faviconı (.ico dosyası, 32x32 veya 16x16)',
                    },
                },
                {
                    name: 'faviconSvg',
                    type: 'upload',
                    relationTo: 'media',
                    label: 'Favicon SVG',
                    filterOptions: {
                        mimeType: { in: ['image/svg+xml'] },
                    },
                    admin: {
                        description: 'Modern tarayıcılar için SVG favicon',
                    },
                },
            ],
        },
        ...auditFields,
    ],
    hooks: {
        afterChange: [revalidateLogo],
    },
    versions: {
        drafts: {
            schedulePublish: true,
        },
    },
}
