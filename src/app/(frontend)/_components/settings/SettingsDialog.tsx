'use client'

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
import SoonSection from './SoonSection'

interface Props {
    open: boolean
    onOpenChange: (o: boolean) => void
    memberEmail: string
}

export default function SettingsDialog({ open, onOpenChange, memberEmail }: Props) {
    const t = useTranslations()
    return (
        <Dialog open={open} onOpenChange={onOpenChange} size="xl">
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t('settings.title')}</DialogTitle>
                </DialogHeader>
                <Tabs
                    defaultValue="profile"
                    orientation="vertical"
                    variant="pills"
                    className="mt-2 flex h-[600px] max-h-[80vh] overflow-hidden rounded-xl border border-zinc-200"
                >
                    <TabsList className="w-44 shrink-0 gap-1 border-r border-zinc-200 bg-zinc-50 p-2">
                        <TabsTrigger value="general" icon={<Settings2 className="size-4" />}>
                            {t('settings.general')}
                        </TabsTrigger>
                        <TabsTrigger value="profile" icon={<User className="size-4" />}>
                            {t('settings.profile')}
                        </TabsTrigger>
                        <TabsTrigger value="memory" icon={<Brain className="size-4" />}>
                            {t('settings.memory')}
                        </TabsTrigger>
                        <TabsTrigger value="usage" icon={<BarChart3 className="size-4" />}>
                            {t('settings.usage')}
                        </TabsTrigger>
                        <TabsTrigger value="account" icon={<ShieldCheck className="size-4" />}>
                            {t('settings.account')}
                        </TabsTrigger>
                        <TabsTrigger value="data" icon={<Database className="size-4" />}>
                            {t('data.title')}
                        </TabsTrigger>
                    </TabsList>

                    <div className="min-w-0 flex-1">
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
                            <SoonSection title={t('settings.usage')} icon={<BarChart3 />} />
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
