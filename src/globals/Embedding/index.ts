import type { GlobalConfig } from 'payload'

import { auditFields } from '@/fields/auditFields'
import { canReadGlobal, canUpdateGlobal, canReadVersionsGlobal, adminOnlyField } from '@/access'
import { embeddingOptions, getEmbeddingProvider } from '@/lib/assistant/providers'

const secretAccess = { read: adminOnlyField, update: adminOnlyField }

export const Embedding: GlobalConfig = {
    slug: 'embedding',
    label: 'Embedding',
    access: {
        read: canReadGlobal('embedding'),
        readVersions: canReadVersionsGlobal('embedding'),
        update: canUpdateGlobal('embedding'),
    },
    admin: { group: 'Asistan Tanımlamaları' },
    fields: [
        {
            name: 'provider',
            label: 'Sağlayıcı',
            type: 'select',
            required: true,
            defaultValue: 'openai',
            options: embeddingOptions,
            admin: { description: 'Soruyu vektöre çeviren servis. Bilgi tabanını indekslerken kullandığınız modelle AYNI olmalı. DB kendisi vektörize ediyorsa "Yok" seçin.' },
        },
        {
            name: 'baseUrl',
            label: 'Base URL',
            type: 'text',
            admin: {
                condition: (_, siblingData) => getEmbeddingProvider(siblingData?.provider)?.editableBaseUrl ?? false,
                placeholder: 'http://localhost:11434/v1',
                description: 'OpenAI-uyumlu embedding adresi (örn. Ollama). Örn. http://localhost:11434/v1',
            },
        },
        {
            name: 'model',
            label: 'Model',
            type: 'text',
            defaultValue: 'text-embedding-3-small',
            admin: {
                condition: (_, siblingData) => siblingData?.provider !== 'none',
                description: 'Bilgi tabanını indeksleyen embedding modeliyle AYNI olmalı. Örn. text-embedding-3-small (OpenAI), nomic-embed-text (Ollama), text-embedding-004 (Gemini).',
            },
        },
        {
            name: 'apiKey',
            label: 'API Anahtarı',
            type: 'text',
            access: secretAccess,
            admin: {
                condition: (_, siblingData) => siblingData?.provider !== 'none',
                description: 'Embedding servisinin API anahtarı. 🔒 Yalnız admin görür. (Ollama gibi yerel servislerde gerekmeyebilir.)',
            },
        },
        {
            name: 'dimensions',
            label: 'Boyut (dimensions)',
            type: 'number',
            min: 1,
            admin: {
                condition: (_, siblingData) => siblingData?.provider !== 'none',
                description: '⚠ Vektör DB ile AYNI boyut olmalı. Örn. OpenAI 3-small: 1536, nomic-embed-text: 768. Ollama/uyumlu için BOŞ bırakın (modelin kendi boyutu kullanılır).',
            },
        },
        ...auditFields,
    ],
    versions: { drafts: { schedulePublish: true } },
}
