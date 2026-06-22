import type { AuthResponse, RegisterInput, Member } from './types'
import type { Citation } from './sse'

const JSON_HEADERS = { 'Content-Type': 'application/json' }

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

export async function login(email: string, password: string): Promise<AuthResponse> {
    const res = await fetch('/api/members/login', {
        method: 'POST',
        headers: JSON_HEADERS,
        body: JSON.stringify({ email, password }),
    })
    if (!res.ok) throw await parseError(res)
    return res.json()
}

export async function register(data: RegisterInput): Promise<void> {
    const res = await fetch('/api/members', {
        method: 'POST',
        headers: JSON_HEADERS,
        body: JSON.stringify({ ...data, authProvider: 'email' }),
    })
    if (!res.ok) throw await parseError(res)
}

export async function logout(): Promise<void> {
    await fetch('/api/members/logout', { method: 'POST', headers: JSON_HEADERS }).catch(() => {})
}

export async function forgotPassword(email: string): Promise<void> {
    const res = await fetch('/api/members/forgot-password', {
        method: 'POST',
        headers: JSON_HEADERS,
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
    const url = `/api/messages?where[conversation][equals]=${encodeURIComponent(conversationId)}&sort=createdAt&limit=500&depth=0`
    const res = await fetch(url)
    if (!res.ok) return []
    const body = await res.json()
    return (body?.docs ?? []) as MessageLite[]
}

export async function deleteConversation(id: string): Promise<void> {
    await fetch(`/api/conversations/${id}`, { method: 'DELETE' }).catch(() => {})
}

export async function renameConversation(id: string, title: string): Promise<void> {
    await fetch(`/api/conversations/${id}`, {
        method: 'PATCH',
        headers: JSON_HEADERS,
        body: JSON.stringify({ title }),
    }).catch(() => {})
}

export async function sendFeedback(messageId: string, feedback: 'up' | 'down'): Promise<void> {
    await fetch(`/api/messages/${messageId}`, {
        method: 'PATCH',
        headers: JSON_HEADERS,
        body: JSON.stringify({ feedback }),
    }).catch(() => {})
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
    await fetch(`/api/folders/${id}`, { method: 'DELETE' }).catch(() => {})
}

export async function moveConversation(id: string, folder: string | null): Promise<void> {
    await fetch(`/api/conversations/${id}`, {
        method: 'PATCH',
        headers: JSON_HEADERS,
        body: JSON.stringify({ folder }),
    }).catch(() => {})
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
    await fetch(`/api/memory/${id}`, { method: 'DELETE' }).catch(() => {})
}

export async function clearMemory(): Promise<void> {
    const items = await listMemory()
    await Promise.all(items.map((m) => deleteMemory(m.id)))
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
