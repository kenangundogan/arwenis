'use client'

import { useState } from 'react'
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarGroupAction,
    SidebarGroupContent,
    SidebarMenu,
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogCancel,
    AlertDialogAction,
} from 'eglador-ui-react'
import { Trash2 } from 'lucide-react'
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

    return (
        <SidebarGroup>
            <SidebarGroupLabel>{folder.name}</SidebarGroupLabel>
            <SidebarGroupAction aria-label={t('chat.deleteFolder')} onClick={() => setTimeout(() => setConfirmOpen(true), 0)}>
                <Trash2 className="size-3.5" />
            </SidebarGroupAction>
            <SidebarGroupContent>
                <SidebarMenu>
                    {conversations.map((c) => (
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
        </SidebarGroup>
    )
}
