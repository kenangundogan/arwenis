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
        {
            name: 'recencyKey',
            label: 'Tarih/Sıralama Alanı (payload key, epoch/integer)',
            type: 'text',
            admin: { description: '"En güncel / en son" sıralaması için kullanılacak payload alanı (epoch ms / integer). Örn. publishedAtTs. Boşsa recency sıralaması devre dışı. (Qdrant\'ta bu alanın integer index\'i olmalı.)' },
        },
        {
            name: 'facets',
            label: 'Fasetler (filtrelenebilir alanlar)',
            type: 'array',
            labels: { singular: 'Faset', plural: 'Fasetler' },
            admin: {
                description: 'Bilgi tabanının filtrelenebilir metadata alanları (domain-agnostik). Sorgu planlayıcı kullanıcı niyetini YALNIZCA buradaki fasetlere eşler. Örn. haber için key=category; e-ticaret için key=brand. Domain default\'u YOKTUR; her kuruluma göre tanımlanır.',
            },
            fields: [
                { name: 'key', label: 'Payload Alanı (key)', type: 'text', required: true, admin: { description: 'Vektör payload\'ındaki alan adı. Örn. category.' } },
                {
                    name: 'type',
                    label: 'Tip',
                    type: 'select',
                    required: true,
                    defaultValue: 'keyword',
                    options: [
                        { label: 'Etiket (keyword — eşitlik filtresi)', value: 'keyword' },
                        { label: 'Sayı (integer)', value: 'integer' },
                        { label: 'Tarih (datetime)', value: 'datetime' },
                    ],
                    admin: { description: 'keyword: değere göre filtre (ör. category=spor). Şu an planlayıcı keyword fasetlerini filtreler.' },
                },
                { name: 'label', label: 'Görünen Ad', type: 'text' },
                {
                    name: 'values',
                    label: 'İzinli Değerler (keyword için)',
                    type: 'array',
                    labels: { singular: 'Değer', plural: 'Değerler' },
                    admin: { description: 'Bu fasetin alabileceği değerler (kapalı küme). Boşsa planlayıcı serbest değer üretebilir. Örn. spor, magazin, ekonomi.' },
                    fields: [
                        { name: 'value', label: 'Değer (payload)', type: 'text', required: true },
                        { name: 'label', label: 'Görünen Ad', type: 'text' },
                    ],
                },
            ],
        },
        ...auditFields,
    ],
    versions: { drafts: { schedulePublish: true } },
}
