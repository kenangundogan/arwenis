import type { Field, PayloadRequest } from 'payload'
import { validateMediaDimensionsAsync } from '@/utilities/validateMedia'

export const imagesFields: Field = {
    label: false,
    name: 'images',
    type: 'group',
    fields: [
        {
            label: 'Görsel 16x9',
            name: 'ratio16x9',
            type: 'upload',
            relationTo: 'media',
            filterOptions: {
                mimeType: { in: ['image/jpeg', 'image/png', 'image/webp'] },
                width: { equals: 1920 },
                height: { equals: 1080 },
            },
            validate: (value: unknown, { req }: { req: PayloadRequest }) => {
                if (!value) return 'Bu alan zorunludur.'
                return validateMediaDimensionsAsync(value, req, 1920, 1080)
            },
            admin: {
                // allowCreate: false,
                description: '16x9 görseli (1920x1080)',
            },
        },
        {
            label: 'Görsel 9x16',
            name: 'ratio9x16',
            type: 'upload',
            relationTo: 'media',
            filterOptions: {
                mimeType: { in: ['image/jpeg', 'image/png', 'image/webp'] },
                width: { equals: 1080 },
                height: { equals: 1920 },
            },
            validate: (value: unknown, { req }: { req: PayloadRequest }) => {
                if (!value) return 'Bu alan zorunludur.'
                return validateMediaDimensionsAsync(value, req, 1080, 1920)
            },
            admin: {
                // allowCreate: false,
                description: '9x16 görseli (1080x1920)',
            },
        },
        {
            label: 'Görsel 1x1',
            name: 'ratio1x1',
            type: 'upload',
            relationTo: 'media',
            filterOptions: {
                mimeType: { in: ['image/jpeg', 'image/png', 'image/webp'] },
                width: { equals: 1080 },
                height: { equals: 1080 },
            },
            validate: (value: unknown, { req }: { req: PayloadRequest }) => {
                if (!value) return 'Bu alan zorunludur.'
                return validateMediaDimensionsAsync(value, req, 1080, 1080)
            },
            admin: {
                // allowCreate: false,
                description: '1x1 görseli (1080x1080)',
            },
        },
    ],
}
