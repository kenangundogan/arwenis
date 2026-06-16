'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
    SidebarMenuItem,
    SidebarMenuButton,
    SidebarMenuAction,
    Dropdown,
    DropdownTrigger,
    DropdownContent,
    DropdownItem,
    DropdownLabel,
    DropdownSeparator,
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogCancel,
    AlertDialogAction,
    Input,
} from 'eglador-ui-react'
import { MoreHorizontal, MessageSquare, Pencil, Trash2, FolderInput, FolderMinus } from 'lucide-react'
import {
    renameConversation,
    deleteConversation,
    moveConversation,
    type ConversationLite,
    type FolderLite,
} from '../_lib/api'
import { useTranslations } from 'next-intl'

interface Props {
    conv: ConversationLite
    active: boolean
    folders: FolderLite[]
    onChanged: () => void
}

export default function ConversationItem({ conv, active, folders, onChanged }: Props) {
    const t = useTranslations()
    const router = useRouter()
    const [editing, setEditing] = useState(false)
    const [title, setTitle] = useState(conv.title || '')
    const [confirmOpen, setConfirmOpen] = useState(false)

    const currentFolderId =
        conv.folder && typeof conv.folder === 'object' ? conv.folder.id : ((conv.folder as string | null) ?? null)

    async function commitRename() {
        setEditing(false)
        const t = title.trim()
        if (t && t !== conv.title) {
            await renameConversation(conv.id, t)
            onChanged()
        } else {
            setTitle(conv.title || '')
        }
    }

    async function move(folderId: string | null) {
        await moveConversation(conv.id, folderId)
        onChanged()
    }

    async function doDelete() {
        await deleteConversation(conv.id)
        setConfirmOpen(false)
        onChanged()
        if (active) router.push('/chat')
    }

    if (editing) {
        return (
            <SidebarMenuItem>
                <div className="px-1 py-0.5">
                    <Input
                        size="sm"
                        autoFocus
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        onBlur={commitRename}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') commitRename()
                            if (e.key === 'Escape') {
                                setTitle(conv.title || '')
                                setEditing(false)
                            }
                        }}
                    />
                </div>
            </SidebarMenuItem>
        )
    }

    return (
        <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={active} tooltip={conv.title || t('chat.newChat')}>
                <Link href={`/chat/${conv.id}`}>
                    <MessageSquare className="size-4" />
                    <span className="truncate">{conv.title || t('chat.newChat')}</span>
                </Link>
            </SidebarMenuButton>

            <Dropdown align="end">
                <DropdownTrigger asChild>
                    <SidebarMenuAction showOnHover aria-label="Seçenekler">
                        <MoreHorizontal className="size-4" />
                    </SidebarMenuAction>
                </DropdownTrigger>
                <DropdownContent>
                    <DropdownItem
                        onSelect={() => {
                            setTitle(conv.title || '')
                            setEditing(true)
                        }}
                    >
                        <Pencil className="size-4" />
                        {t('chat.rename')}
                    </DropdownItem>

                    {folders.length > 0 && (
                        <>
                            <DropdownSeparator />
                            <DropdownLabel>{t('chat.moveToFolder')}</DropdownLabel>
                            {folders.map((f) => (
                                <DropdownItem key={f.id} disabled={f.id === currentFolderId} onSelect={() => move(f.id)}>
                                    <FolderInput className="size-4" />
                                    {f.name}
                                </DropdownItem>
                            ))}
                            {currentFolderId && (
                                <DropdownItem onSelect={() => move(null)}>
                                    <FolderMinus className="size-4" />
                                    {t('chat.removeFromFolder')}
                                </DropdownItem>
                            )}
                        </>
                    )}

                    <DropdownSeparator />
                    <DropdownItem className="text-rose-600" onSelect={() => setTimeout(() => setConfirmOpen(true), 0)}>
                        <Trash2 className="size-4" />
                        {t('chat.delete')}
                    </DropdownItem>
                </DropdownContent>
            </Dropdown>

            <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t('chat.deleteTitle')}</AlertDialogTitle>
                        <AlertDialogDescription>{t('chat.deleteDesc')}</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                        <AlertDialogAction onClick={doDelete} className="bg-rose-600 text-white hover:bg-rose-700">
                            {t('chat.delete')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </SidebarMenuItem>
    )
}
