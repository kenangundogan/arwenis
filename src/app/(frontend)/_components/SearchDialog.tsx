'use client'

import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import {
    CommandDialog,
    CommandInput,
    CommandList,
    CommandEmpty,
    CommandGroup,
    CommandItem,
} from 'eglador-ui-react'
import { MessageCircle } from 'lucide-react'
import type { ConversationLite } from '../_lib/api'

interface Props {
    open: boolean
    onOpenChange: (open: boolean) => void
    convs: ConversationLite[]
}

export default function SearchDialog({ open, onOpenChange, convs }: Props) {
    const t = useTranslations()
    const router = useRouter()

    return (
        <CommandDialog
            open={open}
            onOpenChange={onOpenChange}
            title={t('chat.search')}
            description={t('chat.searchResults')}
        >
            <CommandInput placeholder={t('chat.search')} />
            <CommandList>
                <CommandEmpty>{t('chat.noResults')}</CommandEmpty>
                <CommandGroup heading={t('chat.loose')}>
                    {convs.map((c) => {
                        const title = c.title || t('chat.newChat')
                        return (
                            <CommandItem
                                key={c.id}
                                value={c.id}
                                keywords={[title]}
                                onSelect={() => {
                                    onOpenChange(false)
                                    router.push(`/chat/${c.id}`)
                                }}
                            >
                                <MessageCircle className="size-4 shrink-0 text-zinc-500" />
                                <span className="truncate">{title}</span>
                            </CommandItem>
                        )
                    })}
                </CommandGroup>
            </CommandList>
        </CommandDialog>
    )
}
