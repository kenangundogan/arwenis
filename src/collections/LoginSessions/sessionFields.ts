import type { Field } from 'payload'

export const sessionFields: Field[] = [
    {
        name: 'status',
        label: 'Sonuç',
        type: 'select',
        required: true,
        defaultValue: 'success',
        index: true,
        options: [
            { label: 'Başarılı', value: 'success' },
            { label: 'Başarısız', value: 'failed' },
        ],
        admin: { readOnly: true, position: 'sidebar' },
    },
    {
        name: 'ipAddress',
        label: 'IP Adresi',
        type: 'text',
        index: true,
        admin: { readOnly: true },
    },
    {
        name: 'deviceType',
        label: 'Cihaz Türü',
        type: 'select',
        defaultValue: 'unknown',
        options: [
            { label: 'Masaüstü', value: 'desktop' },
            { label: 'Mobil', value: 'mobile' },
            { label: 'Tablet', value: 'tablet' },
            { label: 'Bot', value: 'bot' },
            { label: 'Bilinmiyor', value: 'unknown' },
        ],
        admin: { readOnly: true },
    },
    {
        name: 'browser',
        label: 'Tarayıcı',
        type: 'text',
        admin: { readOnly: true },
    },
    {
        name: 'os',
        label: 'İşletim Sistemi',
        type: 'text',
        admin: { readOnly: true },
    },
    {
        name: 'userAgent',
        label: 'User Agent (ham)',
        type: 'text',
        admin: { readOnly: true, description: 'İstemcinin gönderdiği ham User-Agent başlığı.' },
    },
]
