'use client'

import type { ReactNode } from 'react'
import { Badge, Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from 'eglador-ui-react'
import { useTranslations } from 'next-intl'

export default function SoonSection({ title, icon }: { title: string; icon: ReactNode }) {
    const t = useTranslations()
    return (
        <div className="flex h-full flex-col">
            <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-zinc-800">{title}</h3>
                <Badge variant="soft" size="sm">
                    {t('settings.soon')}
                </Badge>
            </div>
            <Empty className="flex-1 py-8">
                <EmptyHeader>
                    <EmptyMedia variant="icon">{icon}</EmptyMedia>
                    <EmptyTitle>{t('settings.soon')}</EmptyTitle>
                    <EmptyDescription>{t('settings.soonDesc')}</EmptyDescription>
                </EmptyHeader>
            </Empty>
        </div>
    )
}
