import type { Payload } from 'payload'
import type { Model } from 'mongoose'

export const todayKey = (): string => new Date().toISOString().slice(0, 10)

export const estimateTokens = (text: string): number => Math.ceil((text?.length ?? 0) / 4)

const usageModel = (payload: Payload): Model<Record<string, unknown>> | null => {
    const db = payload.db as unknown as { collections?: Record<string, Model<Record<string, unknown>>> }
    return db.collections?.usage ?? null
}

const findToday = async (payload: Payload, day: string) => {
    const { docs } = await payload.find({
        collection: 'usage',
        where: { day: { equals: day } },
        limit: 1,
        overrideAccess: true,
        depth: 0,
    })
    return docs[0] ?? null
}

export const checkDailyCap = async (payload: Payload, cap: number | null | undefined): Promise<boolean> => {
    if (!cap || cap <= 0) return true
    const doc = await findToday(payload, todayKey())
    return ((doc?.messageCount as number) ?? 0) < cap
}

export const incrementUsage = async (payload: Payload, tokens: number): Promise<void> => {
    const day = todayKey()
    try {
        const model = usageModel(payload)
        if (model) {
            await model.findOneAndUpdate(
                { day },
                { $inc: { messageCount: 1, tokenCount: tokens } },
                { upsert: true },
            )
            return
        }
        const doc = await findToday(payload, day)
        if (doc) {
            await payload.update({
                collection: 'usage',
                id: doc.id,
                data: {
                    messageCount: ((doc.messageCount as number) ?? 0) + 1,
                    tokenCount: ((doc.tokenCount as number) ?? 0) + tokens,
                },
                overrideAccess: true,
            })
        } else {
            await payload.create({
                collection: 'usage',
                data: { day, messageCount: 1, tokenCount: tokens },
                overrideAccess: true,
            })
        }
    } catch (err) {
        payload.logger.error({ err }, '[assistant] usage increment failed')
    }
}
