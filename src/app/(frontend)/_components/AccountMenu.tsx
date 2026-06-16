'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
    Dropdown,
    DropdownTrigger,
    DropdownContent,
    DropdownItem,
    DropdownSeparator,
} from 'eglador-ui-react'
import { Settings, LogOut, ChevronsUpDown } from 'lucide-react'
import { logout } from '../_lib/api'
import SettingsDialog from './settings/SettingsDialog'
import { useTranslations } from 'next-intl'

export default function AccountMenu({ memberName, memberEmail }: { memberName: string; memberEmail: string }) {
    const t = useTranslations()
    const router = useRouter()
    const [settingsOpen, setSettingsOpen] = useState(false)

    async function doLogout() {
        await logout()
        router.replace('/login')
        router.refresh()
    }

    const label = memberName || memberEmail
    const initials = label.slice(0, 1).toUpperCase()

    return (
        <>
            <Dropdown align="start">
                <DropdownTrigger asChild>
                    <button className="flex w-full items-center gap-2 rounded-lg p-2 text-left transition hover:bg-zinc-100">
                        <span className="grid size-7 shrink-0 place-items-center rounded-full bg-zinc-200 text-xs font-semibold text-zinc-600">
                            {initials}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-sm text-zinc-700">{label}</span>
                        <ChevronsUpDown className="size-4 shrink-0 text-zinc-400" />
                    </button>
                </DropdownTrigger>
                <DropdownContent>
                    <DropdownItem onSelect={() => setTimeout(() => setSettingsOpen(true), 0)}>
                        <Settings className="size-4" />
                        {t('settings.title')}
                    </DropdownItem>
                    <DropdownSeparator />
                    <DropdownItem className="text-rose-600" onSelect={doLogout}>
                        <LogOut className="size-4" />
                        {t('auth.logout')}
                    </DropdownItem>
                </DropdownContent>
            </Dropdown>

            <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} memberEmail={memberEmail} />
        </>
    )
}
