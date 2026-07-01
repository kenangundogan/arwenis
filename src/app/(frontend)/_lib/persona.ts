import { getTranslations } from 'next-intl/server'
import { getCachedGlobal } from '@/utilities/getCachedGlobal'

export async function getWelcome(): Promise<{ welcome: string; suggestions: string[] }> {
    const t = await getTranslations()
    try {
        const persona = await getCachedGlobal('persona', 0)()
        return {
            welcome: persona?.welcomeMessage || t('chat.emptyTitle'),
            suggestions: (persona?.suggestedQuestions ?? []).map((q) => q.question).filter(Boolean),
        }
    } catch {
        return { welcome: t('chat.emptyTitle'), suggestions: [] }
    }
}

export const DEFAULT_MAX_MESSAGE_CHARS = 4000
export async function getMaxMessageChars(): Promise<number> {
    try {
        const limits = await getCachedGlobal('limits', 0)()
        const v = limits?.maxMessageChars
        return typeof v === 'number' ? v : DEFAULT_MAX_MESSAGE_CHARS
    } catch {
        return DEFAULT_MAX_MESSAGE_CHARS
    }
}
