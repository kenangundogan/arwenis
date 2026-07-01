'use client'

import { useState } from 'react'
import {
    SidebarMenuItem,
    SidebarMenuButton,
    SidebarMenuAction,
    SidebarMenuSub,
    Collapsible,
    CollapsibleTrigger,
    CollapsibleContent,
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogCancel,
    AlertDialogAction,
} from 'eglador-ui-react'
import { ChevronRight, Folder, Trash2 } from 'lucide-react'
import ConversationItem from './ConversationItem'
import { deleteFolder, type ConversationLite, type FolderLite } from '../_lib/api'
import { useTranslations } from 'next-intl'

interface Props {
    folder: FolderLite
    conversations: ConversationLite[]
    folders: FolderLite[]
    activeId: string | null
    onChanged: () => void
}

export default function FolderSection({ folder, conversations, folders, activeId, onChanged }: Props) {
    const t = useTranslations()
    const [confirmOpen, setConfirmOpen] = useState(false)

    async function doDelete() {
        await deleteFolder(folder.id)
        setConfirmOpen(false)
        onChanged()
    }

    const hasActive = conversations.some((c) => c.id === activeId)

    return (
        <SidebarMenuItem>
            <Collapsible className="group/collapsible" defaultOpen={hasActive}>
                <CollapsibleTrigger asChild>
                    <SidebarMenuButton tooltip={folder.name}>
                        <ChevronRight className="size-4 shrink-0 text-zinc-400 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                        <Folder className="size-4 shrink-0 text-zinc-500" />
                        <span className="truncate">{folder.name}</span>
                    </SidebarMenuButton>
                </CollapsibleTrigger>

                <CollapsibleContent>
                    <SidebarMenuSub>
                        {conversations.length === 0 ? (
                            <li className="px-2 py-1 text-xs text-zinc-400">{t('chat.folderEmpty')}</li>
                        ) : (
                            conversations.map((c) => (
                                <ConversationItem
                                    key={c.id}
                                    conv={c}
                                    active={activeId === c.id}
                                    folders={folders}
                                    onChanged={onChanged}
                                />
                            ))
                        )}
                    </SidebarMenuSub>
                </CollapsibleContent>
            </Collapsible>

            <SidebarMenuAction
                showOnHover
                aria-label={t('chat.deleteFolder')}
                onClick={() => setTimeout(() => setConfirmOpen(true), 0)}
            >
                <Trash2 className="size-3.5" />
            </SidebarMenuAction>

            <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t('chat.deleteFolder')}</AlertDialogTitle>
                        <AlertDialogDescription>{t('chat.deleteFolderDesc')}</AlertDialogDescription>
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
