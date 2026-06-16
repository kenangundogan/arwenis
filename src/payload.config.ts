import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'
import { collections } from './collections'
import { globals } from './globals'
import { endpoints } from './endpoints'
import { tr } from '@payloadcms/translations/languages/tr'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
    admin: {
        user: 'users',
        importMap: {
            baseDir: path.resolve(dirname),
        },
        meta: {
            titleSuffix: '- Arwenis',
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
        components: {
        },
        dashboard: {
            widgets: [
                {
                    slug: 'banner-widget',
                    Component: './components/admin/Widgets/Banner/index.tsx#default',
                    minWidth: 'full',
                    maxWidth: 'full',
                },
            ],
        },
    },
    localization: {
        locales: [
            { label: 'Türkçe', code: 'tr' },
        ],
        defaultLocale: 'tr',
        fallback: true,
    },
    i18n: {
        supportedLanguages: { tr },
        fallbackLanguage: 'tr',
        translations: {},
    },
    collections,
    globals,
    endpoints,
    editor: lexicalEditor(),
    serverURL: process.env.SERVER_URL || undefined,
    cors: process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : undefined,
    csrf: process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : undefined,
    secret: process.env.PAYLOAD_SECRET || '',
    typescript: {
        outputFile: path.resolve(dirname, 'payload-types.ts'),
        strictDraftTypes: true,
    },
    db: mongooseAdapter({
        url: process.env.DATABASE_URL || '',
    }),
    sharp,
    upload: {
        limits: {
            fileSize: 10485760,
        },
    },
    plugins: [],
})
