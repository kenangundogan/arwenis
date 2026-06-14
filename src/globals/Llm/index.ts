import type { GlobalConfig } from 'payload'

import { auditFields } from '@/fields/auditFields'
import { canReadGlobal, canUpdateGlobal, canReadVersionsGlobal, adminOnlyField } from '@/access'
import { llmOptions, isBaseUrlEditable } from '@/lib/assistant/providers'

const secretAccess = { read: adminOnlyField, update: adminOnlyField }

export const Llm: GlobalConfig = {
    slug: 'llm',
    label: 'LLM',
    access: {
        read: canReadGlobal('llm'),
        readVersions: canReadVersionsGlobal('llm'),
        update: canUpdateGlobal('llm'),
    },
    admin: { group: 'Asistan Tanımlamaları' },
    fields: [
        {
            name: 'provider',
            label: 'Sağlayıcı',
            type: 'select',
            required: true,
            defaultValue: 'openrouter',
            options: llmOptions,
            admin: { description: 'Yanıtı üreten LLM sağlayıcısı. Örn. OpenRouter, Anthropic (Claude), Google Gemini ya da kendi OpenAI-uyumlu sunucunuz.' },
        },
        {
            name: 'model',
            label: 'Model',
            type: 'text',
            required: true,
            defaultValue: 'openai/gpt-4o-mini',
            admin: { description: 'Kullanılacak model kimliği. Örn. openai/gpt-4o-mini (OpenRouter), claude-haiku-4-5 (Anthropic), gemini-2.0-flash (Gemini).' },
        },
        {
            name: 'apiKey',
            label: 'API Anahtarı',
            type: 'text',
            access: secretAccess,
            admin: { description: 'Sağlayıcının API anahtarı. 🔒 Yalnız admin görür, dışa verilmez. Örn. sk-or-v1-… (OpenRouter).' },
        },
        {
            name: 'baseUrl',
            label: 'Base URL',
            type: 'text',
            admin: {
                condition: (_, siblingData) => isBaseUrlEditable(siblingData?.provider),
                placeholder: 'http://localhost:11434/v1',
                description: 'Yalnız OpenAI-uyumlu (self-hosted/Azure/Ollama) için gerekir. Örn. http://localhost:11434/v1. Diğer sağlayıcılarda sabit (panelden değiştirilemez — güvenlik).',
            },
        },
        {
            name: 'maxTokens',
            label: 'Maks. Token',
            type: 'number',
            defaultValue: 1024,
            min: 1,
            max: 32000,
            admin: { description: 'Yanıt için üst token sınırı. Örn. 1024. Yüksek = daha uzun yanıt + daha çok maliyet.' },
        },
        {
            name: 'temperature',
            label: 'Sıcaklık (temperature)',
            type: 'number',
            defaultValue: 0.3,
            min: 0,
            max: 2,
            admin: { step: 0.1, description: 'Yaratıcılık/çeşitlilik: 0 = tutarlı ve net, 1+ = serbest. Bilgi asistanı için 0.2–0.4 önerilir.' },
        },
        ...auditFields,
    ],
    versions: { drafts: { schedulePublish: true } },
}
