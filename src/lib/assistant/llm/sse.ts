export async function* parseSSE(response: Response): AsyncGenerator<string> {
    if (!response.body) return
    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    try {
        while (true) {
            const { done, value } = await reader.read()
            if (done) break
            buffer += decoder.decode(value, { stream: true })

            let nlIndex: number
            while ((nlIndex = buffer.indexOf('\n')) >= 0) {
                const line = buffer.slice(0, nlIndex).replace(/\r$/, '')
                buffer = buffer.slice(nlIndex + 1)
                if (line.startsWith('data:')) {
                    yield line.slice(5).trimStart()
                }
            }
        }

        const tail = buffer.trim()
        if (tail.startsWith('data:')) {
            yield tail.slice(5).trimStart()
        }
    } finally {
        reader.releaseLock()
    }
}

export const safeErrorText = async (response: Response): Promise<string> => {
    try {
        const text = await response.text()
        return text.slice(0, 500)
    } catch {
        return ''
    }
}
