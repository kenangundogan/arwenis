/**
 * RAG retrieval test harness.
 *   pnpm payload run scripts/test-retrieval.ts            (varsayılan sorular)
 *   pnpm payload run scripts/test-retrieval.ts "soru 1" "soru 2"
 *
 * Uygulamanın kendi config + planQuery + retrieve zincirini gerçek vektör DB'ye
 * karşı çalıştırır; her soru için planı (filtre/recency) ve dönen pasajları yazar.
 */
import { getPayload } from 'payload'
import config from '@payload-config'
import { loadAssistantConfig } from '@/lib/assistant/loadConfig'
import { planQuery, retrieve } from '@/lib/assistant/retrieve'

const payload = await getPayload({ config })
const settings = await loadAssistantConfig(payload)

const r = settings.retrieval
console.log('================ RETRIEVAL CONFIG ================')
console.log('provider :', r?.provider, '| index:', r?.index, '| url:', r?.url)
console.log('textKey  :', r?.textKey, '| recencyKey:', r?.recencyKey)
console.log('minScore :', r?.minScore, '| topK:', r?.topK)
console.log('facets   :', JSON.stringify((r?.facets ?? []).filter(Boolean).map((f: any) => ({ key: f.key, type: f.type, values: (f.values ?? []).length }))))

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
