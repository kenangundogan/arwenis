import type { GlobalConfig } from 'payload'

import { auditFields } from '@/fields/auditFields'
import { canReadGlobal, canUpdateGlobal, canReadVersionsGlobal, adminOnlyField } from '@/access'
import { vectorOptions } from '@/lib/assistant/providers'

const secretAccess = { read: adminOnlyField, update: adminOnlyField }

export const Retrieval: GlobalConfig = {
    slug: 'retrieval',
    label: 'Vektör DB',
    access: {
        read: canReadGlobal('retrieval'),
        readVersions: canReadVersionsGlobal('retrieval'),
        update: canUpdateGlobal('retrieval'),
    },
    admin: { group: 'Asistan Tanımlamaları' },
    fields: [
        {
            name: 'provider',
            label: 'Sağlayıcı',
            type: 'select',
            required: true,
            defaultValue: 'qdrant',
            options: vectorOptions,
            admin: { description: 'Bilgi tabanınızın tutulduğu vektör veritabanı. Örn. Qdrant, Pinecone, Weaviate.' },
        },
        {
            name: 'url',
            label: 'URL',
            type: 'text',
            admin: { description: 'Vektör DB adresi. Örn. http://localhost:6333 (Qdrant) veya https://<index>-xxxx.svc.pinecone.io' },
        },
        {
            name: 'apiKey',
            label: 'API Anahtarı',
            type: 'text',
            access: secretAccess,
            admin: { description: 'Vektör DB erişim anahtarı (gerekiyorsa). 🔒 Yalnız admin görür. Yerel Qdrant\'ta boş olabilir.' },
        },
        {
            name: 'index',
            label: 'Index / Collection',
            type: 'text',
            admin: { description: 'Aranacak koleksiyon/index adı. Örn. Qdrant collection: gleam_demo · Pinecone: index adı · Weaviate: Class adı.' },
        },
        {
            name: 'namespace',
            label: 'Namespace',
            type: 'text',
            admin: { description: 'Opsiyonel bölümleme (örn. Pinecone namespace). Boş bırakılabilir.' },
        },
        {
            name: 'topK',
            label: 'topK',
            type: 'number',
            defaultValue: 5,
            min: 1,
            max: 50,
            admin: { description: 'Her soruda getirilecek en benzer pasaj sayısı. Örn. 5.' },
        },
        {
            name: 'minScore',
            label: 'Min. Skor',
            type: 'number',
            defaultValue: 0.5,
            min: 0,
            max: 1,
            admin: {
                step: 0.01,
                description: 'Benzerlik eşiği (0–1). Bu skorun altındaki pasajlar elenir; hiçbiri geçmezse asistan "bilmiyorum" der. Örn. 0.75. (Tanılama ▸ Sorgu Testi ile ayarlayın.)',
            },
        },
        {
            name: 'textKey',
            label: 'Metin Alanı (payload key)',
            type: 'text',
            defaultValue: 'text',
            admin: { description: 'Pasaj METNİNİN saklandığı alan adı. Örn. text / content / chunk.' },
        },
        ...auditFields,
    ],
    versions: { drafts: { schedulePublish: true } },
}
