import { getPayload } from 'payload'
import config from '@payload-config'
import { loadAssistantConfig } from '@/lib/assistant/loadConfig'
import { resolveRetrieval } from '@/lib/assistant/config'
import { planQuery, retrieve } from '@/lib/assistant/retrieve'

const payload = await getPayload({ config })
const settings = await loadAssistantConfig(payload)

console.log('================ RETRIEVAL CONFIG (resolved) ================')
try {
    const r = resolveRetrieval(settings)
    console.log('provider :', r.providerId, '| index:', r.index, '| url:', r.url)
    console.log('textKey  :', r.textKey, '| recencyKey:', r.recencyKey ?? '-')
    console.log('minScore :', r.minScore, '| topK:', r.topK)
    console.log('citation :', JSON.stringify({ title: r.citation.titleKey, url: r.citation.urlKey, image: r.citation.imageKey, desc: r.citation.descriptionKey, date: r.citation.publishedAtKey }))
    console.log('fetch    :', r.citation.fetchFields.join(', '))
    console.log('facets   :', JSON.stringify(r.facets.map((f) => ({ key: f.key, type: f.type, values: f.values.length }))))
} catch (e) {
    console.log('  CONFIG HATASI:', (e as Error).message)
}

const cli = process.argv.slice(2).filter((a) => !a.startsWith('-'))
const questions = cli.length
    ? cli
    : [
        'son ekonomi haberleri neler?',
        'en güncel teknoloji haberleri',
        'lezzetli yemek tarifleri',
        'bu hafta vizyona giren filmler',
        'günlük burç yorumları',
    ]

for (const q of questions) {
    console.log('\n\n========== SORU:', q)
    try {
        const plan = await planQuery(settings, [], q)
        console.log('  PLAN → query:', JSON.stringify(plan.query), '| wantsLatest:', plan.wantsLatest, '| filters:', JSON.stringify(plan.filters))
        const cites = await retrieve(settings, plan)
        console.log(`  SONUÇ: ${cites.length} pasaj (ilk 5):`)
        cites.slice(0, 5).forEach((c, i) => {
            const cat = c.facets?.category ? `[${c.facets.category}] ` : ''
            console.log(`    [${i + 1}] score=${(c.score ?? 0).toFixed(3)} | ${c.publishedAt ?? '-'} | ${cat}${c.title ?? '(başlıksız)'}`)
        })
    } catch (e) {
        console.log('  HATA:', (e as Error).message)
    }
}

process.exit(0)
