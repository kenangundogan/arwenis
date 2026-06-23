export type ChatEvent =
    | { type: 'conversation'; id: string }
    | { type: 'text'; text: string }
    | { type: 'citations'; citations: Citation[] }
    | { type: 'done'; usage?: unknown; messageId?: string }
    | { type: 'error'; message: string }

export interface Citation {
    n?: number
    index?: number
    title?: string
    url?: string
    score?: number
    snippet?: string
    publishedAt?: string
}

export async function readSSE(
    res: Response,
    onEvent: (e: ChatEvent) => void,
): Promise<void> {
    if (!res.body) return
    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buf = ''
    for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        buf += decoder.decode(value, { stream: true })
        const frames = buf.split('\n\n')
        buf = frames.pop() ?? ''
        for (const frame of frames) {
            const dataLine = frame.split('\n').find((l) => l.startsWith('data:'))
            if (!dataLine) continue
            const payload = dataLine.slice(5).trim()
            if (!payload) continue
            try {
                onEvent(JSON.parse(payload) as ChatEvent)
            } catch {
                /* ignore malformed frame */
            }
        }
    }
}
