import type { GlobalConfig } from 'payload'
import { revalidateCookiePolicy } from './hooks/revalidateCookiePolicy'
import {
    FixedToolbarFeature,
    HeadingFeature,
    HorizontalRuleFeature,
    InlineToolbarFeature,
    lexicalEditor,
} from '@payloadcms/richtext-lexical'
import { auditFields } from '@/fields/auditFields'
import {
    canReadGlobal,
    canUpdateGlobal,
    canReadVersionsGlobal,
} from '@/access'
import {
    composeValidators,
    generalText,
    minLength,
    maxLength,
    jsonSizeValidator,
    richTextRequired,
} from '@/utilities/validators'

export const CookiePolicy: GlobalConfig = {
    label: 'Çerez Politikası',
    slug: 'cookiePolicy',
    access: {
        read: canReadGlobal('cookiePolicy'),
        readVersions: canReadVersionsGlobal('cookiePolicy'),
        update: canUpdateGlobal('cookiePolicy'),
    },
    admin: {
        group: 'Ayarlar',
    },
    fields: [
        {
            label: 'Çerez Politikası Aktif',
            name: 'enabled',
            type: 'checkbox',
            defaultValue: true,
            admin: {
                description: 'Çerez politikasının aktif olup olmadığını belirler',
            },
        },
        {
            label: 'İçerik',
            name: 'content',
            type: 'richText',
            editor: lexicalEditor({
                features: ({ rootFeatures }) => {
                    return [
                        ...rootFeatures,
                        HeadingFeature({ enabledHeadingSizes: ['h2', 'h3', 'h4'] }),
                        FixedToolbarFeature(),
                        InlineToolbarFeature(),
                        HorizontalRuleFeature(),
                    ]
                },
            }),
            required: true,
            validate: composeValidators(
                richTextRequired('Lütfen çerez politikası için bir içerik giriniz.'),
                jsonSizeValidator(5000, 'İçerik çok uzun/karmaşık. Lütfen daha sade bir metin giriniz.'),
            ),
            admin: {
                description: 'Çerez politikası metni',
            },
        },
        {
            type: 'row',
            fields: [
                {
                    name: 'acceptButton',
                    type: 'group',
                    label: 'Kabul Buton Ayarları',
                    fields: [
                        {
                            label: 'Kabul Butonunu Göster',
                            name: 'show',
                            type: 'checkbox',
                            defaultValue: true,
                        },
                        {
                            label: 'Kabul Buton Metni',
                            name: 'text',
                            type: 'text',
                            defaultValue: 'Kabul Et',
                            required: true,
                            validate: composeValidators(
                                generalText(),
                                minLength(3),
                                maxLength(50),
                            ),
                            admin: {
                                condition: (_, siblingData) => siblingData?.show,
                                description: 'Çerez politikasını kabul et butonunda gösterilecek metin',
                            },
                        },
                    ],
                },
                {
                    name: 'rejectButton',
                    type: 'group',
                    label: 'Reddet Buton Ayarları',
                    fields: [
                        {
                            label: 'Reddet Butonunu Göster',
                            name: 'show',
                            type: 'checkbox',
                            defaultValue: true,
                        },
                        {
                            label: 'Reddet Buton Metni',
                            name: 'text',
                            type: 'text',
                            defaultValue: 'Reddet',
                            required: true,
                            validate: composeValidators(
                                generalText(),
                                minLength(3),
                                maxLength(50),
                            ),
                            admin: {
                                condition: (_, siblingData) => siblingData?.show,
                                description: 'Çerez politikasını reddet butonunda gösterilecek metin',
                            },
                        },
                    ],
                },
            ],
        },
        ...auditFields,
    ],
    hooks: {
        afterChange: [revalidateCookiePolicy],
    },
    versions: {
        drafts: {
            schedulePublish: true,
        },
    },
}
