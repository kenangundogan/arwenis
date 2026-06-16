'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
    SidebarHeader,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarGroupContent,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
    SidebarInput,
    Button,
    Input,
    Empty,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
    EmptyDescription,
    EmptyContent,
} from 'eglador-ui-react'
import { Plus, FolderPlus, Search, MessagesSquare, SearchX } from 'lucide-react'
import { createFolder, type ConversationLite, type FolderLite } from '../_lib/api'
import ConversationItem from './ConversationItem'
import FolderSection from './FolderSection'
import AccountMenu from './AccountMenu'
import { useTranslations } from 'next-intl'

const folderIdOf = (c: ConversationLite): string | null =>
    c.folder && typeof c.folder === 'object' ? c.folder.id : ((c.folder as string | null) ?? null)

const norm = (s: string) => s.toLocaleLowerCase('tr')

interface Props {
    convs: ConversationLite[]
    folders: FolderLite[]
    onChanged: () => void
    memberName: string
    memberEmail: string
    brandName: string
    logoUrl: string | null
    logoAlt: string
}

export default function AppSidebar({
    convs,
    folders,
    onChanged,
    memberName,
    memberEmail,
    brandName,
    logoUrl,
    logoAlt,
}: Props) {
    const t = useTranslations()
    const [newFolder, setNewFolder] = useState(false)
    const [folderName, setFolderName] = useState('')
    const [query, setQuery] = useState('')
    const router = useRouter()
    const pathname = usePathname()
    const activeId = pathname.startsWith('/chat/') ? pathname.slice('/chat/'.length) : null

    const q = query.trim()

    const { byFolder, loose } = useMemo(() => {
        const map = new Map<string, ConversationLite[]>()
        const rest: ConversationLite[] = []
        for (const c of convs) {
            const fid = folderIdOf(c)
            if (fid) {
                const arr = map.get(fid) ?? []
                arr.push(c)
                map.set(fid, arr)
            } else {
                rest.push(c)
            }
        }
        return { byFolder: map, loose: rest }
    }, [convs])

    const results = useMemo(() => {
        if (!q) return []
        const nq = norm(q)
        return convs.filter((c) => norm(c.title || '').includes(nq))
    }, [q, convs])

    async function submitFolder() {
        const name = folderName.trim()
        setNewFolder(false)
        setFolderName('')
        if (name) {
            await createFolder(name)
            onChanged()
        }
    }

    const isEmpty = convs.length === 0 && folders.length === 0

    return (
        <>
            <SidebarHeader>
                <div className="flex items-center gap-2 px-2 py-1.5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {logoUrl ? <img src={logoUrl} alt={logoAlt} className="h-6 w-auto" /> : null}
                    <span className="truncate text-base font-semibold text-zinc-800">{brandName}</span>
                </div>
                <div className="flex items-center gap-1">
                    <SidebarMenu className="flex-1">
                        <SidebarMenuItem>
                            <SidebarMenuButton asChild>
                                <Link href="/chat">
                                    <Plus className="size-4" />
                                    <span>{t('chat.newChat')}</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                    <Button
                        variant="ghost"
                        size="sm"
                        shape="square"
                        aria-label={t('chat.newFolder')}
                        onClick={() => setNewFolder((v) => !v)}
                    >
                        <FolderPlus className="size-4" />
                    </Button>
                </div>
                <div className="relative px-1 pt-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
                    <SidebarInput
                        className="pl-8"
                        placeholder={t('chat.search')}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                </div>
            </SidebarHeader>

            <SidebarContent>
                {q ? (
                    results.length > 0 ? (
                        <SidebarGroup>
                            <SidebarGroupLabel>{t('chat.searchResults')}</SidebarGroupLabel>
                            <SidebarGroupContent>
                                <SidebarMenu>
                                    {results.map((c) => (
                                        <ConversationItem
                                            key={c.id}
                                            conv={c}
                                            active={activeId === c.id}
                                            folders={folders}
                                            onChanged={onChanged}
                                        />
                                    ))}
                                </SidebarMenu>
                            </SidebarGroupContent>
                        </SidebarGroup>
                    ) : (
                        <Empty className="px-2 py-8">
                            <EmptyHeader>
                                <EmptyMedia variant="icon">
                                    <SearchX />
                                </EmptyMedia>
                                <EmptyTitle>{t('chat.noResults')}</EmptyTitle>
                                <EmptyDescription>{t('chat.noResultsDesc')}</EmptyDescription>
                            </EmptyHeader>
                        </Empty>
                    )
                ) : isEmpty ? (
                    <Empty className="px-2 py-8">
                        <EmptyHeader>
                            <EmptyMedia variant="icon">
                                <MessagesSquare />
                            </EmptyMedia>
                            <EmptyTitle>{t('chat.noConversations')}</EmptyTitle>
                            <EmptyDescription>{t('chat.noConversationsDesc')}</EmptyDescription>
                        </EmptyHeader>
                        <EmptyContent>
                            <Button size="sm" onClick={() => router.push('/chat')}>
                                <Plus className="size-4" />
                                {t('chat.newChat')}
                            </Button>
                        </EmptyContent>
                    </Empty>
                ) : (
                    <>
                        {newFolder && (
                            <div className="px-2 pb-1">
                                <Input
                                    size="sm"
                                    autoFocus
                                    placeholder={t('chat.folderNamePlaceholder')}
                                    value={folderName}
                                    onChange={(e) => setFolderName(e.target.value)}
                                    onBlur={submitFolder}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') submitFolder()
                                        if (e.key === 'Escape') {
                                            setNewFolder(false)
                                            setFolderName('')
                                        }
                                    }}
                                />
                            </div>
                        )}

                        {folders.map((f) => (
                            <FolderSection
                                key={f.id}
                                folder={f}
                                conversations={byFolder.get(f.id) ?? []}
                                folders={folders}
                                activeId={activeId}
                                onChanged={onChanged}
                            />
                        ))}

                        <SidebarGroup>
                            {folders.length > 0 && <SidebarGroupLabel>{t('chat.loose')}</SidebarGroupLabel>}
                            <SidebarGroupContent>
                                <SidebarMenu>
                                    {loose.map((c) => (
                                        <ConversationItem
                                            key={c.id}
                                            conv={c}
                                            active={activeId === c.id}
                                            folders={folders}
                                            onChanged={onChanged}
                                        />
                                    ))}
                                </SidebarMenu>
                            </SidebarGroupContent>
                        </SidebarGroup>
                    </>
                )}
            </SidebarContent>

            <SidebarFooter>
                <AccountMenu memberName={memberName} memberEmail={memberEmail} />
            </SidebarFooter>
        </>
    )
}
