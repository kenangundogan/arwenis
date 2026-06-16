import type { GlobalConfig } from 'payload'

import { auditFields } from '@/fields/auditFields'
import { canReadGlobal, canUpdateGlobal, canReadVersionsGlobal } from '@/access'
import { composeValidators, required, maxLength } from '@/utilities/validators'
import { DEFAULT_PERSONA } from '@/lib/assistant/promptDefaults'
import { revalidatePersona } from './hooks/revalidatePersona'

export const Persona: GlobalConfig = {
    slug: 'persona',
    label: 'Karşılama & Persona',
    access: {
        read: canReadGlobal('persona'),
        readVersions: canReadVersionsGlobal('persona'),
        update: canUpdateGlobal('persona'),
    },
    admin: { group: 'Asistan Tanımlamaları' },
    fields: [
        {
            name: 'welcomeMessage',
            label: 'Karşılama Mesajı',
            type: 'textarea',
            localized: true,
            defaultValue: 'Merhaba! Size nasıl yardımcı olabilirim?',
            validate: composeValidators(maxLength(500)),
            admin: { description: 'Sohbet ilk açıldığında gösterilen karşılama metni. Örn. "Merhaba! Size nasıl yardımcı olabilirim?"' },
        },
        {
            name: 'persona',
            label: 'Persona / Üslup',
            type: 'textarea',
            localized: true,
            defaultValue: DEFAULT_PERSONA,
            validate: composeValidators(maxLength(2000)),
            admin: { description: 'Asistanın konuşma üslubu/kişiliği. Örn. "Resmi, kısa ve net yanıtlar ver." Sistem promptuna eklenir; güvenlik ve kaynak kurallarını değiştiremez.' },
        },
        {
            name: 'suggestedQuestions',
            label: 'Öneri Sorular',
            type: 'array',
            localized: true,
            maxRows: 6,
            labels: { singular: 'Soru', plural: 'Sorular' },
            fields: [
                {
                    name: 'question',
                    type: 'text',
                    required: true,
                    validate: composeValidators(required(), maxLength(160)),
                    admin: { placeholder: 'Örn. İade politikanız nedir?' },
                },
            ],
            admin: { description: 'Boş sohbet ekranında tıklanabilir örnek sorular (en fazla 6). Örn. "İade politikanız nedir?"' },
        },
        ...auditFields,
    ],
    hooks: {
        afterChange: [revalidatePersona],
    },
    versions: { drafts: { schedulePublish: true } },
}
