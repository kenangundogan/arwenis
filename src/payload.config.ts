import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'
import { tr } from '@payloadcms/translations/languages/tr'

import { Users } from './collections/Users'
import { Media } from './collections/Media'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
    admin: {
        user: Users.slug,
        importMap: {
            baseDir: path.resolve(dirname),
        },
        meta: {
            titleSuffix: '- Gleam',
            icons: [
                {
                    rel: 'icon',
                    type: 'image/png',
                    url: '/favicon.svg',
                },
                {
                    rel: 'apple-touch-icon',
                    type: 'image/png',
                    url: '/favicon.svg',
                },
            ],
        },
        timezones: {
            supportedTimezones: [
                {
                    label: 'UTC',
                    value: 'UTC',
                },
                {
                    label: 'Istanbul',
                    value: 'Europe/Istanbul',
                },
            ],
            defaultTimezone: 'UTC',
        },
    },
    localization: {
        locales: ['tr'],
        defaultLocale: 'tr',
        fallback: true,
    },
    i18n: {
        supportedLanguages: { tr },
        fallbackLanguage: 'tr',
        translations: {},
    },
    collections: [Users, Media],
    editor: lexicalEditor(),
    secret: process.env.PAYLOAD_SECRET || '',
    typescript: {
        outputFile: path.resolve(dirname, 'payload-types.ts'),
    },
    db: mongooseAdapter({
        url: process.env.DATABASE_URL || '',
    }),
    sharp,
    plugins: [],
})
