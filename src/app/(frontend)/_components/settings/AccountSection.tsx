'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Input, Label, Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from 'eglador-ui-react'
import { Monitor, Smartphone, Tablet, Bot, HelpCircle, ShieldCheck } from 'lucide-react'
import { listSessions, type SessionLite } from '../../_lib/api'

const deviceIcon = (type: SessionLite['deviceType']) => {
    switch (type) {
        case 'mobile':
            return Smartphone
        case 'tablet':
            return Tablet
        case 'desktop':
            return Monitor
        case 'bot':
            return Bot
        default:
            return HelpCircle
    }
}

export default function AccountSection({ email }: { email: string }) {
    const t = useTranslations()
    const td = useTranslations('device')
    const ts = useTranslations('sessions')
    const [sessions, setSessions] = useState<SessionLite[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let active = true
        setLoading(true)
        listSessions().then((d) => {
            if (!active) return
            setSessions(d)
            setLoading(false)
        })
        return () => {
            active = false
        }
    }, [])

    const relTime = (iso: string): string => {
        const diff = Math.max(0, Date.now() - new Date(iso).getTime())
        const min = Math.floor(diff / 60000)
        if (min < 1) return ts('justNow')
        if (min < 60) return ts('minutesAgo', { count: min })
        const hr = Math.floor(min / 60)
        if (hr < 24) return ts('hoursAgo', { count: hr })
        const day = Math.floor(hr / 24)
        if (day < 7) return ts('daysAgo', { count: day })
        return new Date(iso).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' })
    }

    return (
        <div className="flex h-full flex-col">
            <div>
                <h3 className="text-base font-semibold text-zinc-800">{t('settings.account')}</h3>
            </div>

            <div className="mt-4 flex flex-col gap-1.5">
                <Label htmlFor="acc-email">{t('common.email')}</Label>
                <Input id="acc-email" value={email} disabled readOnly />
            </div>

            <div className="mt-6 flex min-h-0 flex-1 flex-col">
                <div>
                    <h4 className="text-sm font-semibold text-zinc-800">{ts('title')}</h4>
                    <p className="mt-0.5 text-sm text-zinc-500">{ts('desc')}</p>
                </div>

                <div className="mt-3 flex-1 overflow-y-auto">
                    {loading ? (
                        <p className="py-6 text-center text-sm text-zinc-400">{t('common.loading')}</p>
                    ) : sessions.length === 0 ? (
                        <Empty className="py-8">
                            <EmptyHeader>
                                <EmptyMedia variant="icon">
                                    <ShieldCheck />
                                </EmptyMedia>
                                <EmptyTitle>{ts('empty')}</EmptyTitle>
                                <EmptyDescription>{ts('emptyDesc')}</EmptyDescription>
                            </EmptyHeader>
                        </Empty>
                    ) : (
                        <ul className="space-y-1.5">
                            {sessions.map((s) => {
                                const Icon = deviceIcon(s.deviceType)
                                const head = [s.browser, s.os].filter(Boolean).join(' · ') || ts('unknownDevice')
                                const sub = [td(s.deviceType ?? 'unknown'), s.ipAddress].filter(Boolean).join(' · ')
                                return (
                                    <li
                                        key={s.id}
                                        className="flex items-center gap-3 rounded-lg border border-zinc-200 px-3 py-2.5"
                                    >
                                        <Icon className="size-5 shrink-0 text-zinc-500" />
                                        <div className="min-w-0 flex-1">
                                            <div className="truncate text-sm font-medium text-zinc-800">{head}</div>
                                            <div className="truncate text-xs text-zinc-500">{sub}</div>
                                        </div>
                                        <span className="shrink-0 text-xs text-zinc-400">{relTime(s.createdAt)}</span>
                                    </li>
                                )
                            })}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    )
}
