import type { TaskConfig } from 'payload'

import { loadAssistantConfig } from '@/lib/assistant/loadConfig'
import { summarizeAndExtract } from '@/lib/assistant/summarize'
import { loadHistory, loadMemories, saveMemories } from '@/lib/assistant/store'

export const summarizeTurnTask: TaskConfig<'summarizeTurn'> = {
    slug: 'summarizeTurn',
    label: 'Konuşma özeti + hafıza çıkarımı',
    inputSchema: [{ name: 'conversationId', type: 'text', required: true }],
    handler: async ({ input, req }) => {
        const { payload } = req
        try {
            const settings = await loadAssistantConfig(payload)
            if (settings.memory?.persistConversations === false) return { output: {} }

            const conv = (await payload.findByID({
                collection: 'conversations',
                id: input.conversationId,
                depth: 0,
                overrideAccess: true,
            })) as { summary?: string | null; member?: string | { id: string } } | null
            if (!conv) return { output: {} }

            const memberId = conv.member && typeof conv.member === 'object' ? conv.member.id : conv.member
            const crossConv = settings.memory?.crossConversation !== false
            const windowSize = settings.memory?.historyWindow ?? 10
            const turns = await loadHistory(payload, String(input.conversationId), windowSize)
            if (turns.length === 0) return { output: {} }

            const existingFacts = crossConv && memberId ? (await loadMemories(payload, String(memberId))).map((m) => m.text) : []

            const { summary, newFacts } = await summarizeAndExtract(settings, {
                priorSummary: conv.summary,
                turns,
                extractFacts: crossConv,
                existingFacts,
            })
            if (summary) {
                await payload.update({
                    collection: 'conversations',
                    id: input.conversationId,
                    data: { summary },
                    overrideAccess: true,
                })
            }
            if (crossConv && newFacts.length && memberId) {
                await saveMemories(payload, String(memberId), newFacts)
            }
        } catch (err) {
            payload.logger.error({ err }, '[assistant] summarizeTurn job failed')
        }
        return { output: {} }
    },
}
