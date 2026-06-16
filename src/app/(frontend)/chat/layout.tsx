import React from 'react'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getCurrentMember } from '@/utilities/getCurrentMember'
import { getCachedGlobal } from '@/utilities/getCachedGlobal'
import type { ConversationLite, FolderLite } from '../_lib/api'
import ChatShell from '../_components/ChatShell'

export default async function ChatLayout({ children }: { children: React.ReactNode }) {
    const member = await getCurrentMember()
    if (!member) redirect('/login')
    const name = [member.firstName, member.lastName].filter(Boolean).join(' ')

    const payload = await getPayload({ config })
    const [convsRes, foldersRes, theme] = await Promise.all([
        payload.find({
            collection: 'conversations',
            where: { member: { equals: member.id } },
            sort: '-lastMessageAt',
            limit: 100,
            depth: 0,
            overrideAccess: false,
            user: member,
        }),
        payload.find({
            collection: 'folders',
            where: { member: { equals: member.id } },
            sort: 'name',
            limit: 200,
            depth: 0,
            overrideAccess: false,
            user: member,
        }),
        getCachedGlobal('theme', 1)().catch(() => null),
    ])

    const initialConvs: ConversationLite[] = convsRes.docs.map((c) => ({
        id: String(c.id),
        title: c.title ?? null,
        lastMessageAt: c.lastMessageAt ?? null,
        folder: (c.folder as string | null) ?? null,
    }))
    const initialFolders: FolderLite[] = foldersRes.docs.map((f) => ({ id: String(f.id), name: f.name }))

    const brandName = theme?.name || 'Arwenis'
    const logoUrl = theme?.logo && typeof theme.logo === 'object' ? (theme.logo.url ?? null) : null

    return (
        <ChatShell
            memberName={name}
            memberEmail={member.email}
            brandName={brandName}
            logoUrl={logoUrl}
            logoAlt={theme?.logoAlt || brandName}
            initialConvs={initialConvs}
            initialFolders={initialFolders}
        >
            {children}
        </ChatShell>
    )
}
