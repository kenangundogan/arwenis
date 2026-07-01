import type { GlobalConfig } from 'payload'

import { auditFields } from '@/fields/auditFields'
import { canReadGlobal, canUpdateGlobal, canReadVersionsGlobal } from '@/access'

export const Limits: GlobalConfig = {
    slug: 'limits',
    label: 'Limitler',
    access: {
        read: canReadGlobal('limits'),
        readVersions: canReadVersionsGlobal('limits'),
        update: canUpdateGlobal('limits'),
    },
    admin: { group: 'Asistan Tanımlamaları' },
    fields: [
        {
            name: 'dailyMessageCap',
            label: 'Günlük Mesaj Tavanı',
            type: 'number',
            defaultValue: 1000,
            min: 0,
            admin: { description: 'Tüm kurum için günlük toplam mesaj sınırı (maliyet sigortası). Örn. 1000. 0 = sınırsız.' },
        },
        {
            name: 'perIpRateLimit',
            label: 'IP Rate Limit (dk)',
            type: 'number',
            defaultValue: 20,
            min: 0,
            admin: { description: 'Aynı IP\'nin dakikada gönderebileceği mesaj sayısı. Örn. 20. 0 = sınırsız.' },
        },
        {
            name: 'maxConversationMessages',
            label: 'Konuşma Başına Maks. Mesaj',
            type: 'number',
            defaultValue: 100,
            min: 0,
            admin: { description: 'Tek bir konuşmada izin verilen maksimum mesaj. Örn. 100. 0 = sınırsız.' },
        },
        {
            name: 'maxConversationsPerUser',
            label: 'Kullanıcı Başına Maks. Konuşma',
            type: 'number',
            defaultValue: 50,
            min: 0,
            admin: { description: 'Bir kullanıcının açabileceği maksimum konuşma. Örn. 50. 0 = sınırsız.' },
        },
        {
            name: 'maxMessageChars',
            label: 'Mesaj Karakter Sınırı',
            type: 'number',
            defaultValue: 4000,
            min: 0,
            admin: {
                description:
                    'Kullanıcının tek mesajda gönderebileceği maksimum karakter. Hem giriş kutusunda (maxLength + sayaç) hem sunucuda uygulanır. Örn. 4000. 0 = sınırsız. Değişikliğin son kullanıcıya yansıması için yayınlayın.',
            },
        },
        ...auditFields,
    ],
    versions: { drafts: { schedulePublish: true } },
}
