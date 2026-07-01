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
    Button,
    Input,
    Empty,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
    EmptyDescription,
    EmptyContent,
} from 'eglador-ui-react'
import { Plus, FolderPlus, Search, MessagesSquare } from 'lucide-react'
import { createFolder, type ConversationLite, type FolderLite } from '../_lib/api'
import ConversationItem from './ConversationItem'
import FolderSection from './FolderSection'
import AccountMenu from './AccountMenu'
import SearchDialog from './SearchDialog'
import { useTranslations } from 'next-intl'

const folderIdOf = (c: ConversationLite): string | null =>
    c.folder && typeof c.folder === 'object' ? c.folder.id : ((c.folder as string | null) ?? null)

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
    const [searchOpen, setSearchOpen] = useState(false)
    const [newFolder, setNewFolder] = useState(false)
    const [folderName, setFolderName] = useState('')
    const router = useRouter()
    const pathname = usePathname()
    const activeId = pathname.startsWith('/chat/') ? pathname.slice('/chat/'.length) : null

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
            <SidebarHeader className="gap-2">
                <div className="flex h-8 items-center gap-2 px-1 group-data-[collapsible=icon]/sidebar:justify-center group-data-[collapsible=icon]/sidebar:px-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {logoUrl ? <img src={logoUrl} alt={logoAlt} className="h-6 w-auto shrink-0" /> : null}
                    <span className="truncate text-base font-semibold text-zinc-800 group-data-[collapsible=icon]/sidebar:hidden">
                        {brandName}
                    </span>
                </div>

                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild tooltip={t('chat.newChat')}>
                            <Link href="/chat">
                                <Plus className="size-4" />
                                <span>{t('chat.newChat')}</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton tooltip={t('chat.search')} onClick={() => setSearchOpen(true)}>
                            <Search className="size-4" />
                            <span>{t('chat.search')}</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem className="group-data-[collapsible=icon]/sidebar:hidden">
                        <SidebarMenuButton tooltip={t('chat.newFolder')} onClick={() => setNewFolder((v) => !v)}>
                            <FolderPlus className="size-4" />
                            <span>{t('chat.newFolder')}</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <div className="flex flex-col gap-1 group-data-[collapsible=icon]/sidebar:hidden">
                    {isEmpty ? (
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

                            {folders.length > 0 && (
                                <SidebarGroup className="px-2 py-1">
                                    <SidebarGroupLabel>{t('chat.folders')}</SidebarGroupLabel>
                                    <SidebarGroupContent>
                                        <SidebarMenu>
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
                                        </SidebarMenu>
                                    </SidebarGroupContent>
                                </SidebarGroup>
                            )}

                            {loose.length > 0 && (
                                <SidebarGroup className="px-2 py-1">
                                    <SidebarGroupLabel>{t('chat.loose')}</SidebarGroupLabel>
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
                            )}
                        </>
                    )}
                </div>
            </SidebarContent>

            <SidebarFooter>
                <AccountMenu memberName={memberName} memberEmail={memberEmail} />
            </SidebarFooter>

            <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} convs={convs} />
        </>
    )
}
