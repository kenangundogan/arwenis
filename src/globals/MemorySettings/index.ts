import type { GlobalConfig } from 'payload'

import { auditFields } from '@/fields/auditFields'
import { canReadGlobal, canUpdateGlobal, canReadVersionsGlobal } from '@/access'

export const MemorySettings: GlobalConfig = {
    slug: 'memorySettings',
    label: 'Hafıza',
    access: {
        read: canReadGlobal('memorySettings'),
        readVersions: canReadVersionsGlobal('memorySettings'),
        update: canUpdateGlobal('memorySettings'),
    },
    admin: { group: 'Asistan Tanımlamaları' },
    fields: [
        {
            name: 'persistConversations',
            label: 'Konuşmaları Sakla',
            type: 'checkbox',
            defaultValue: true,
            admin: { description: 'Konuşmalar ve mesajlar veritabanına kaydedilsin mi? Kapalıysa geçmiş tutulmaz (sidebar boş kalır).' },
        },
        {
            name: 'historyWindow',
            label: 'Geçmiş Penceresi',
            type: 'number',
            defaultValue: 10,
            min: 0,
            max: 100,
            admin: { description: 'Modele bağlam olarak verilecek son mesaj sayısı. Örn. 10. Yüksek = daha çok bağlam + daha çok token.' },
        },
        {
            name: 'crossConversation',
            label: 'Konuşmalar-Arası Hafıza',
            type: 'checkbox',
            defaultValue: true,
            admin: { description: 'Kullanıcı hakkında öğrenilenleri konuşmalar arasında hatırla (ChatGPT "Memory" gibi).' },
        },
        {
            name: 'retentionDays',
            label: 'Saklama Süresi (gün)',
            type: 'number',
            defaultValue: 90,
            min: 0,
            admin: { description: 'Eski konuşma/hafıza kaç gün sonra silinsin. Örn. 90. 0 = sınırsız. (Otomatik temizleme ileride eklenecek.)' },
        },
        ...auditFields,
    ],
    versions: { drafts: { schedulePublish: true } },
}
