import type { AuthResponse, RegisterInput, Member } from './types'
import type { Citation } from './sse'

const JSON_HEADERS = { 'Content-Type': 'application/json' }

const withRecaptcha = (token?: string | null): Record<string, string> =>
    token ? { ...JSON_HEADERS, 'x-recaptcha-token': token } : JSON_HEADERS

export interface ConversationLite {
    id: string
    title?: string | null
    lastMessageAt?: string | null
    folder?: string | { id: string } | null
}

export interface MessageLite {
    id: string
    role: 'user' | 'assistant'
    content: string
    citations?: Citation[] | null
    variants?: { content: string; citations?: Citation[] | null }[] | null
    activeVariant?: number | null
    feedback?: 'up' | 'down' | null
}

const parseError = async (res: Response): Promise<Error> => {
    try {
        const body = await res.json()
        const msg = body?.errors?.[0]?.message || body?.message
        if (msg) return new Error(msg)
    } catch {
        /* ignore */
    }
    return new Error('İstek başarısız oldu.')
}

export async function login(email: string, password: string, recaptchaToken?: string | null): Promise<AuthResponse> {
    const res = await fetch('/api/members/login', {
        method: 'POST',
        headers: withRecaptcha(recaptchaToken),
        body: JSON.stringify({ email, password }),
    })
    if (!res.ok) throw await parseError(res)
    return res.json()
}

export async function register(data: RegisterInput, recaptchaToken?: string | null): Promise<void> {
    const res = await fetch('/api/members', {
        method: 'POST',
        headers: withRecaptcha(recaptchaToken),
        body: JSON.stringify({ ...data, authProvider: 'email' }),
    })
    if (!res.ok) throw await parseError(res)
}

export async function deleteAccount(): Promise<void> {
    const res = await fetch('/api/assistant/account/delete', {
        method: 'POST',
        headers: { ...JSON_HEADERS, 'Sec-Fetch-Site': 'same-origin' },
    })
    if (!res.ok) throw await parseError(res)
}

export async function logout(): Promise<void> {
    await fetch('/api/members/logout', { method: 'POST', headers: JSON_HEADERS }).catch(() => { })
}

export async function forgotPassword(email: string, recaptchaToken?: string | null): Promise<void> {
    const res = await fetch('/api/members/forgot-password', {
        method: 'POST',
        headers: withRecaptcha(recaptchaToken),
        body: JSON.stringify({ email }),
    })
    if (!res.ok) throw await parseError(res)
}

export async function resetPassword(token: string, password: string): Promise<void> {
    const res = await fetch('/api/members/reset-password', {
        method: 'POST',
        headers: JSON_HEADERS,
        body: JSON.stringify({ token, password }),
    })
    if (!res.ok) throw await parseError(res)
}

export async function verifyEmail(token: string): Promise<void> {
    const res = await fetch(`/api/members/verify/${encodeURIComponent(token)}`, {
        method: 'POST',
        headers: JSON_HEADERS,
    })
    if (!res.ok) throw await parseError(res)
}

export async function listConversations(): Promise<ConversationLite[]> {
    const res = await fetch('/api/conversations?sort=-lastMessageAt&limit=100&depth=0')
    if (!res.ok) return []
    const body = await res.json()
    return (body?.docs ?? []) as ConversationLite[]
}

export async function getMessages(conversationId: string): Promise<MessageLite[]> {
    const url = `/api/messages?where[conversation][equals]=${encodeURIComponent(conversationId)}&sort=-createdAt&limit=500&depth=0`
    const res = await fetch(url)
    if (!res.ok) return []
    const body = await res.json()
    return ((body?.docs ?? []) as MessageLite[]).reverse()
}

export async function deleteConversation(id: string): Promise<void> {
    const res = await fetch(`/api/conversations/${id}`, {
        method: 'PATCH',
        headers: JSON_HEADERS,
        body: JSON.stringify({ deletedAt: new Date().toISOString() }),
    })
    if (!res.ok) throw await parseError(res)
}

async function allDocIds(collectionPath: string): Promise<string[]> {
    const res = await fetch(`${collectionPath}?limit=0&depth=0`)
    if (!res.ok) return []
    const body = await res.json()
    return ((body?.docs ?? []) as { id: string }[]).map((d) => d.id)
}

export async function clearConversations(): Promise<void> {
    const ids = await allDocIds('/api/conversations')
    await Promise.all(ids.map((id) => deleteConversation(id)))
}

export async function exportData(): Promise<void> {
    const res = await fetch('/api/assistant/export')
    if (!res.ok) throw await parseError(res)
    const fromHeader = res.headers.get('content-disposition')?.match(/filename="?([^"]+)"?/i)?.[1]
    const filename = fromHeader || `arwenis-export-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
}

export async function renameConversation(id: string, title: string): Promise<void> {
    const res = await fetch(`/api/conversations/${id}`, {
        method: 'PATCH',
        headers: JSON_HEADERS,
        body: JSON.stringify({ title }),
    })
    if (!res.ok) throw await parseError(res)
}

export async function sendFeedback(messageId: string, feedback: 'up' | 'down' | null): Promise<void> {
    const res = await fetch(`/api/messages/${messageId}`, {
        method: 'PATCH',
        headers: JSON_HEADERS,
        body: JSON.stringify({ feedback }),
    })
    if (!res.ok) throw await parseError(res)
}

export async function setActiveVariant(messageId: string, index: number): Promise<void> {
    await fetch(`/api/messages/${messageId}`, {
        method: 'PATCH',
        headers: JSON_HEADERS,
        body: JSON.stringify({ activeVariant: index }),
    }).catch(() => { })
}

export interface FolderLite {
    id: string
    name: string
}

export async function listFolders(): Promise<FolderLite[]> {
    const res = await fetch('/api/folders?sort=name&limit=200&depth=0')
    if (!res.ok) return []
    const body = await res.json()
    return (body?.docs ?? []) as FolderLite[]
}

export async function createFolder(name: string): Promise<void> {
    const res = await fetch('/api/folders', { method: 'POST', headers: JSON_HEADERS, body: JSON.stringify({ name }) })
    if (!res.ok) throw await parseError(res)
}

export async function deleteFolder(id: string): Promise<void> {
    const res = await fetch(`/api/folders/${id}`, { method: 'DELETE' })
    if (!res.ok) throw await parseError(res)
}

export async function clearFolders(): Promise<void> {
    const ids = await allDocIds('/api/folders')
    await Promise.all(ids.map((id) => deleteFolder(id)))
}

export async function moveConversation(id: string, folder: string | null): Promise<void> {
    const res = await fetch(`/api/conversations/${id}`, {
        method: 'PATCH',
        headers: JSON_HEADERS,
        body: JSON.stringify({ folder }),
    })
    if (!res.ok) throw await parseError(res)
}

export async function getMe(): Promise<Member | null> {
    const res = await fetch('/api/members/me')
    if (!res.ok) return null
    const body = await res.json()
    return (body?.user ?? null) as Member | null
}

export type ProfileInput = Partial<{
    firstName: string
    lastName: string
    gsm: string
    landline: string
    locale: string
}>

export async function updateProfile(id: string, data: ProfileInput): Promise<void> {
    const res = await fetch(`/api/members/${id}`, {
        method: 'PATCH',
        headers: JSON_HEADERS,
        body: JSON.stringify(data),
    })
    if (!res.ok) throw await parseError(res)
}

export interface MemoryLite {
    id: string
    text: string
}

export async function listMemory(): Promise<MemoryLite[]> {
    const res = await fetch('/api/memory?sort=-createdAt&limit=200&depth=0')
    if (!res.ok) return []
    const body = await res.json()
    return (body?.docs ?? []) as MemoryLite[]
}

export async function deleteMemory(id: string): Promise<void> {
    const res = await fetch(`/api/memory/${id}`, { method: 'DELETE' })
    if (!res.ok) throw await parseError(res)
}

export async function clearMemory(): Promise<void> {
    const ids = await allDocIds('/api/memory')
    await Promise.all(ids.map((id) => deleteMemory(id)))
}

export interface SessionLite {
    id: string
    ipAddress?: string | null
    deviceType?: 'desktop' | 'mobile' | 'tablet' | 'bot' | 'unknown' | null
    browser?: string | null
    os?: string | null
    status?: 'success' | 'failed' | null
    createdAt: string
}

export async function listSessions(): Promise<SessionLite[]> {
    const res = await fetch('/api/member-login-sessions?sort=-createdAt&limit=20&depth=0')
    if (!res.ok) return []
    const body = await res.json()
    return (body?.docs ?? []) as SessionLite[]
}

export async function deleteSession(id: string): Promise<void> {
    const res = await fetch(`/api/member-login-sessions/${id}`, { method: 'DELETE' })
    if (!res.ok) throw await parseError(res)
}

export async function clearSessions(): Promise<void> {
    const ids = await allDocIds('/api/member-login-sessions')
    await Promise.all(ids.map((id) => deleteSession(id)))
}

export interface AccountLite {
    id: string
    provider: string
    providerAccountId?: string
    createdAt: string
}

export async function listAccounts(): Promise<AccountLite[]> {
    const res = await fetch('/api/member-accounts?sort=-createdAt&limit=20&depth=0')
    if (!res.ok) return []
    const body = await res.json()
    return (body?.docs ?? []) as AccountLite[]
}

export interface UsageDaily {
    day: string
    messages: number
    tokens: number
}

export interface UsageStats {
    totalMessages: number
    userMessages: number
    assistantMessages: number
    tokensIn: number
    tokensOut: number
    totalTokens: number
    conversations: number
    daily: UsageDaily[]
}

interface UsageMessageRow {
    role?: 'user' | 'assistant' | null
    tokensIn?: number | null
    tokensOut?: number | null
    createdAt?: string | null
}

export async function getUsageStats(days = 30): Promise<UsageStats> {
    const [msgRes, convRes] = await Promise.all([
        fetch(
            '/api/messages?limit=0&depth=0&sort=createdAt' +
            '&select[role]=true&select[tokensIn]=true&select[tokensOut]=true&select[createdAt]=true',
        ),
        fetch('/api/conversations?limit=1&depth=0'),
    ])
    const msgBody = msgRes.ok ? await msgRes.json() : { docs: [] }
    const convBody = convRes.ok ? await convRes.json() : { totalDocs: 0 }
    const rows = (msgBody?.docs ?? []) as UsageMessageRow[]

    const dayMs = 86_400_000
    const todayUTC = new Date(new Date().toISOString().slice(0, 10) + 'T00:00:00.000Z').getTime()
    const startUTC = todayUTC - (days - 1) * dayMs
    const buckets = new Map<string, UsageDaily>()
    for (let i = 0; i < days; i++) {
        const key = new Date(startUTC + i * dayMs).toISOString().slice(0, 10)
        buckets.set(key, { day: key, messages: 0, tokens: 0 })
    }

    let userMessages = 0
    let assistantMessages = 0
    let tokensIn = 0
    let tokensOut = 0
    for (const r of rows) {
        if (r.role === 'user') userMessages++
        else if (r.role === 'assistant') assistantMessages++
        const ti = r.tokensIn ?? 0
        const to = r.tokensOut ?? 0
        tokensIn += ti
        tokensOut += to
        const bucket = r.createdAt ? buckets.get(r.createdAt.slice(0, 10)) : undefined
        if (bucket) {
            bucket.messages++
            bucket.tokens += ti + to
        }
    }

    return {
        totalMessages: rows.length,
        userMessages,
        assistantMessages,
        tokensIn,
        tokensOut,
        totalTokens: tokensIn + tokensOut,
        conversations: (convBody?.totalDocs as number) ?? 0,
        daily: Array.from(buckets.values()),
    }
}
