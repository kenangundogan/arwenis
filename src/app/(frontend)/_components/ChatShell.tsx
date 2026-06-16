'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { SidebarProvider, Sidebar, SidebarInset, SidebarTrigger, SidebarRail } from 'eglador-ui-react'
import { listConversations, listFolders, type ConversationLite, type FolderLite } from '../_lib/api'
import AppSidebar from './AppSidebar'

interface Props {
    memberName: string
    memberEmail: string
    brandName: string
    logoUrl: string | null
    logoAlt: string
    initialConvs: ConversationLite[]
    initialFolders: FolderLite[]
    children: React.ReactNode
}

export default function ChatShell({
    memberName,
    memberEmail,
    brandName,
    logoUrl,
    logoAlt,
    initialConvs,
    initialFolders,
    children,
}: Props) {
    const [convs, setConvs] = useState<ConversationLite[]>(initialConvs)
    const [folders, setFolders] = useState<FolderLite[]>(initialFolders)

    const refresh = useCallback(() => {
        Promise.all([listConversations(), listFolders()]).then(([c, f]) => {
            setConvs(c)
            setFolders(f)
        })
    }, [])

    useEffect(() => {
        const onChange = () => refresh()
        window.addEventListener('arwenis:conversations-changed', onChange)
        return () => window.removeEventListener('arwenis:conversations-changed', onChange)
    }, [refresh])

    return (
        <SidebarProvider>
            <Sidebar collapsible="offcanvas">
                <AppSidebar
                    convs={convs}
                    folders={folders}
                    onChanged={refresh}
                    memberName={memberName}
                    memberEmail={memberEmail}
                    brandName={brandName}
                    logoUrl={logoUrl}
                    logoAlt={logoAlt}
                />
                <SidebarRail />
            </Sidebar>
            <SidebarInset>
                <header className="flex h-12 shrink-0 items-center gap-2 border-b border-zinc-200 bg-white px-3">
                    <SidebarTrigger />
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {logoUrl ? <img src={logoUrl} alt={logoAlt} className="h-5 w-auto" /> : null}
                    <span className="truncate text-sm font-medium text-zinc-700">{brandName}</span>
                </header>
                <div className="min-h-0 flex-1">{children}</div>
            </SidebarInset>
        </SidebarProvider>
    )
}
