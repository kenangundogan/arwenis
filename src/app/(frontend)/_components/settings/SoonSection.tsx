'use client'

import type { ReactNode } from 'react'
import { Badge, Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from 'eglador-ui-react'
import { useTranslations } from 'next-intl'

export default function SoonSection({ title, icon }: { title: string; icon: ReactNode }) {
    const t = useTranslations()
    return (
        <div className="flex h-full flex-col">
            <div className="flex shrink-0 items-center gap-2 border-b border-zinc-100 px-5 pb-3 pt-5">
                <h3 className="text-base font-semibold text-zinc-800">{title}</h3>
                <Badge variant="soft" size="sm">
                    {t('settings.soon')}
                </Badge>
            </div>
            <div className="flex flex-1 items-center justify-center px-5 py-4">
                <Empty>
                    <EmptyHeader>
                        <EmptyMedia variant="icon">{icon}</EmptyMedia>
                        <EmptyTitle>{t('settings.soon')}</EmptyTitle>
                        <EmptyDescription>{t('settings.soonDesc')}</EmptyDescription>
                    </EmptyHeader>
                </Empty>
            </div>
        </div>
    )
}
