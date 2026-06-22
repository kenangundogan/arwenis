import type { GlobalConfig } from 'payload'

import { auditFields } from '@/fields/auditFields'
import { canReadGlobal, canUpdateGlobal, canReadVersionsGlobal } from '@/access'
import {
    DEFAULT_SYSTEM_PROMPT,
    DEFAULT_NO_CONTEXT_REPLY,
    DEFAULT_SUMMARY_PROMPT,
    DEFAULT_MEMORY_EXTRACT_PROMPT,
    DEFAULT_TITLE_PROMPT,
    DEFAULT_CONTEXTUALIZE_PROMPT,
    DEFAULT_QUERY_PLAN_PROMPT,
} from '@/lib/assistant/promptDefaults'

export const Prompts: GlobalConfig = {
    slug: 'prompts',
    label: 'Prompt\'lar',
    access: {
        read: canReadGlobal('prompts'),
        readVersions: canReadVersionsGlobal('prompts'),
        update: canUpdateGlobal('prompts'),
    },
    admin: { group: 'Asistan Tanımlamaları' },
    fields: [
        {
            name: 'systemPrompt',
            label: 'Sistem / Guardrail',
            type: 'textarea',
            localized: true,
            defaultValue: DEFAULT_SYSTEM_PROMPT,
            admin: { description: 'Asistanın ana talimatı: yalnız kaynaklardan cevap ver, uydurma, kullanıcının dilinde yanıtla. {{persona}}, {{sources}}, {{user}} değişkenleri otomatik doldurulur.' },
        },
        {
            name: 'noContextReply',
            label: 'Bağlam Yok Yanıtı',
            type: 'textarea',
            localized: true,
            defaultValue: DEFAULT_NO_CONTEXT_REPLY,
            admin: { description: 'İlgili kaynak bulunamadığında gösterilen sabit yanıt. Örn. "Bu konuda elimde bilgi yok."' },
        },
        {
            name: 'summaryPrompt',
            label: 'Özet Prompt\'u',
            type: 'textarea',
            localized: true,
            defaultValue: DEFAULT_SUMMARY_PROMPT,
            admin: { description: 'Her tur sonunda konuşma özetini güncellemek için (arka planda; bağlamı kısa tutar).' },
        },
        {
            name: 'memoryExtractPrompt',
            label: 'Hafıza Çıkarım Prompt\'u',
            type: 'textarea',
            localized: true,
            defaultValue: DEFAULT_MEMORY_EXTRACT_PROMPT,
            admin: { description: 'Konuşmadan kullanıcı hakkında kalıcı bilgileri çıkarır. Örn. "Kullanıcı hukukla ilgileniyor."' },
        },
        {
            name: 'titlePrompt',
            label: 'Başlık Prompt\'u',
            type: 'textarea',
            localized: true,
            defaultValue: DEFAULT_TITLE_PROMPT,
            admin: { description: 'İlk mesajdan yeni konuşmaya otomatik kısa başlık üretir.' },
        },
        {
            name: 'contextualizePrompt',
            label: 'Sorgu Bağlamlandırma Prompt\'u',
            type: 'textarea',
            localized: true,
            defaultValue: DEFAULT_CONTEXTUALIZE_PROMPT,
            admin: { description: 'Takip sorularını (örn. "peki ya fiyatı?") önceki bağlamla bağımsız bir aramaya çevirir.' },
        },
        {
            name: 'queryPlanPrompt',
            label: 'Sorgu Planlama Prompt\'u',
            type: 'textarea',
            localized: true,
            defaultValue: DEFAULT_QUERY_PLAN_PROMPT,
            admin: { description: 'Kullanıcı mesajını arama planına çevirir: konu sorgusu + kategori(ler) + "en güncel mi?". {{categories}} otomatik doldurulur. "En son magazin haberleri" gibi sorgular için gereklidir.' },
        },
        ...auditFields,
    ],
    versions: { drafts: { schedulePublish: true } },
}
