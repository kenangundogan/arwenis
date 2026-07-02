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
            type: 'tabs',
            tabs: [
                {
                    label: 'Bağlantı',
                    description: 'Vektör DB sağlayıcısı ve erişim bilgileri.',
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
                    ],
                },
                {
                    label: 'Arama',
                    description: 'Kaç pasaj çekilir ve benzerlik eşiği.',
                    fields: [
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
                    ],
                },
                {
                    label: 'Payload Alanları',
                    description:
                        'Vektör kaydındaki alanların şeması: her satır bir alan; rolleri o alanın ne işe yaradığını söyler. Tüm alan eşlemesi tek yerden yönetilir.',
                    fields: [
                        {
                            name: 'payloadFields',
                            label: 'Payload Alanları (şema)',
                            type: 'array',
                            labels: { singular: 'Alan', plural: 'Alanlar' },
                            admin: {
                                description:
                                    'Her satır payload\'daki BİR alanı tanımlar. Roller: Pasaj metni (RAG içeriği — tam 1 satırda olmalı, fazlaysa ilki kullanılır) · kart slotları (Başlık/Link/Görsel/Açıklama/Tarih) · Sıralama ("en güncel" için, epoch/integer; Qdrant\'ta integer index gerekir) · Filtre (sorgu planlayıcı yalnız bu alanlara filtre uygular). Rolsüz satır yalnızca çekilir. Weaviate\'te SADECE bu tablodaki alanlar sorgulanır. Yeni alan gerektiğinde satır ekleyin — kod değişmez.',
                            },
                            defaultValue: [
                                { field: 'text', roles: ['text'] },
                                { field: 'title', roles: ['title'] },
                                { field: 'url', roles: ['url'] },
                                { field: 'images', roles: ['image'] },
                                { field: 'description', roles: ['description'] },
                            ],
                            fields: [
                                {
                                    name: 'field',
                                    label: 'Alan (payload key)',
                                    type: 'text',
                                    required: true,
                                    admin: { description: 'Vektör payload\'ındaki alan adı. Örn. text, title, url, images, category, publishedAtTs.' },
                                },
                                {
                                    name: 'roles',
                                    label: 'Roller',
                                    type: 'select',
                                    hasMany: true,
                                    options: [
                                        { label: 'Pasaj metni (RAG içeriği)', value: 'text' },
                                        { label: 'Başlık', value: 'title' },
                                        { label: 'Link (URL)', value: 'url' },
                                        { label: 'Görsel', value: 'image' },
                                        { label: 'Açıklama', value: 'description' },
                                        { label: 'Tarih (kartta, string/ISO)', value: 'date' },
                                        { label: 'Sıralama (güncellik, epoch/integer)', value: 'sort' },
                                        { label: 'Filtre (faset)', value: 'filter' },
                                    ],
                                    admin: { description: 'Bir alan birden çok rol alabilir (ör. Tarih + Sıralama). Boş = yalnızca çekilir. "Filtre" seçilince filtre ayarları aşağıda belirir.' },
                                },
                                {
                                    name: 'label',
                                    label: 'Görünen Ad',
                                    type: 'text',
                                    admin: {
                                        description: 'Planlayıcıya/tanılamaya gösterilen ad. Boşsa alan adı kullanılır.',
                                        condition: (_, siblingData) => Array.isArray(siblingData?.roles) && siblingData.roles.includes('filter'),
                                    },
                                },
                                {
                                    name: 'filterType',
                                    label: 'Filtre Tipi',
                                    type: 'select',
                                    defaultValue: 'keyword',
                                    options: [
                                        { label: 'Etiket (keyword — eşitlik filtresi)', value: 'keyword' },
                                        { label: 'Sayı (integer)', value: 'integer' },
                                        { label: 'Tarih (datetime)', value: 'datetime' },
                                    ],
                                    admin: {
                                        description: 'keyword: değere göre filtre (ör. category=spor). Şu an planlayıcı keyword fasetlerini filtreler.',
                                        condition: (_, siblingData) => Array.isArray(siblingData?.roles) && siblingData.roles.includes('filter'),
                                    },
                                },
                                {
                                    name: 'allowedValues',
                                    label: 'İzinli Değerler (keyword için)',
                                    type: 'array',
                                    labels: { singular: 'Değer', plural: 'Değerler' },
                                    admin: {
                                        description:
                                            'Bu filtrenin alabileceği değerler (kapalı küme). Değer = payload\'daki ham değer; Görünen Ad planlayıcıya değerle birlikte verilir (ör. "kultur-sanat (Kültür-Sanat)") ve eşleme isabetini artırır. Liste doluyken dışındaki değerler elenir; boşsa planlayıcı serbest değer üretebilir.',
                                        condition: (_, siblingData) =>
                                            Array.isArray(siblingData?.roles) &&
                                            siblingData.roles.includes('filter') &&
                                            (siblingData?.filterType ?? 'keyword') === 'keyword',
                                    },
                                    fields: [
                                        { name: 'value', label: 'Değer (payload)', type: 'text', required: true },
                                        { name: 'label', label: 'Görünen Ad', type: 'text' },
                                    ],
                                },
                            ],
                        },
                    ],
                },
            ],
        },
        ...auditFields,
    ],
    versions: { drafts: { schedulePublish: true } },
}
