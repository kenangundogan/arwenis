'use client'

import { useEffect, useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    Tabs,
    TabsList,
    TabsTrigger,
    TabsContent,
} from 'eglador-ui-react'
import { Settings2, User, Brain, BarChart3, ShieldCheck, Database } from 'lucide-react'
import { useTranslations } from 'next-intl'
import ProfileSection from './ProfileSection'
import GeneralSection from './GeneralSection'
import MemorySection from './MemorySection'
import AccountSection from './AccountSection'
import DataSection from './DataSection'
import UsageSection from './UsageSection'

interface Props {
    open: boolean
    onOpenChange: (o: boolean) => void
    memberEmail: string
}

// Masaüstü ≥640px: dikey yan sekmeler. Mobil: yatay, kaydırılabilir sekmeler (iç içe girmeyi önler).
function useIsDesktop(): boolean {
    const [desktop, setDesktop] = useState(true)
    useEffect(() => {
        const mq = window.matchMedia('(min-width: 640px)')
        const update = () => setDesktop(mq.matches)
        update()
        mq.addEventListener('change', update)
        return () => mq.removeEventListener('change', update)
    }, [])
    return desktop
}

export default function SettingsDialog({ open, onOpenChange, memberEmail }: Props) {
    const t = useTranslations()
    const desktop = useIsDesktop()

    return (
        <Dialog open={open} onOpenChange={onOpenChange} size="xl">
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t('settings.title')}</DialogTitle>
                </DialogHeader>
                <Tabs
                    defaultValue="profile"
                    orientation={desktop ? 'vertical' : 'horizontal'}
                    variant="pills"
                    className="mt-2 h-150 max-h-[calc(100dvh-8rem)] overflow-hidden rounded-xl border border-zinc-200"
                >
                    <TabsList
                        scrollable
                        style={{ height: 'auto' }}
                        className="shrink-0 gap-1 border-b border-zinc-200 bg-zinc-50 p-2 sm:w-44 sm:border-b-0 sm:border-r"
                    >
                        <TabsTrigger value="general" icon={<Settings2 className="size-4" />} className="whitespace-nowrap">
                            {t('settings.general')}
                        </TabsTrigger>
                        <TabsTrigger value="profile" icon={<User className="size-4" />} className="whitespace-nowrap">
                            {t('settings.profile')}
                        </TabsTrigger>
                        <TabsTrigger value="memory" icon={<Brain className="size-4" />} className="whitespace-nowrap">
                            {t('settings.memory')}
                        </TabsTrigger>
                        <TabsTrigger value="usage" icon={<BarChart3 className="size-4" />} className="whitespace-nowrap">
                            {t('settings.usage')}
                        </TabsTrigger>
                        <TabsTrigger value="account" icon={<ShieldCheck className="size-4" />} className="whitespace-nowrap">
                            {t('settings.account')}
                        </TabsTrigger>
                        <TabsTrigger value="data" icon={<Database className="size-4" />} className="whitespace-nowrap">
                            {t('data.title')}
                        </TabsTrigger>
                    </TabsList>

                    <div className="min-h-0 min-w-0 flex-1">
                        <TabsContent value="general" className="h-full">
                            <GeneralSection />
                        </TabsContent>
                        <TabsContent value="profile" className="h-full">
                            <ProfileSection />
                        </TabsContent>
                        <TabsContent value="memory" className="h-full">
                            <MemorySection />
                        </TabsContent>
                        <TabsContent value="usage" className="h-full">
                            <UsageSection />
                        </TabsContent>
                        <TabsContent value="account" className="h-full">
                            <AccountSection email={memberEmail} />
                        </TabsContent>
                        <TabsContent value="data" className="h-full">
                            <DataSection />
                        </TabsContent>
                    </div>
                </Tabs>
            </DialogContent>
        </Dialog>
    )
}
