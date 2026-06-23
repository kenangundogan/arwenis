'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Input, Label, Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, ScrollArea } from 'eglador-ui-react'
import { Monitor, Smartphone, Tablet, Bot, HelpCircle, ShieldCheck, KeyRound } from 'lucide-react'
import { listSessions, listAccounts, type SessionLite, type AccountLite } from '../../_lib/api'

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

const GoogleMark = () => (
    <svg viewBox="0 0 48 48" className="size-5 shrink-0" aria-hidden="true">
        <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
        <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
        <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
        <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
    </svg>
)

const providerLabel = (p: string): string => (p === 'google' ? 'Google' : p === 'apple' ? 'Apple' : p.charAt(0).toUpperCase() + p.slice(1))

export default function AccountSection({ email }: { email: string }) {
    const t = useTranslations()
    const td = useTranslations('device')
    const ts = useTranslations('sessions')
    const [sessions, setSessions] = useState<SessionLite[]>([])
    const [accounts, setAccounts] = useState<AccountLite[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let active = true
        setLoading(true)
        Promise.all([listSessions(), listAccounts()]).then(([s, a]) => {
            if (!active) return
            setSessions(s)
            setAccounts(a)
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

    const connectedDate = (iso: string): string =>
        new Date(iso).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })

    return (
        <div className="flex h-full flex-col">
            <div className="shrink-0 border-b border-zinc-100 px-5 pb-3 pt-5">
                <h3 className="text-base font-semibold text-zinc-800">{t('settings.account')}</h3>
                <div className="mt-4 flex flex-col gap-1.5">
                    <Label htmlFor="acc-email">{t('common.email')}</Label>
                    <Input id="acc-email" value={email} disabled readOnly />
                </div>

                {accounts.length > 0 && (
                    <div className="mt-5">
                        <h4 className="text-sm font-semibold text-zinc-800">{t('settings.connectedAccounts')}</h4>
                        <p className="mt-0.5 text-sm text-zinc-500">{t('settings.connectedAccountsDesc')}</p>
                        <ul className="mt-2 space-y-1.5">
                            {accounts.map((a) => (
                                <li key={a.id} className="flex items-center gap-3 rounded-lg border border-zinc-200 px-3 py-2.5">
                                    {a.provider === 'google' ? <GoogleMark /> : <KeyRound className="size-5 shrink-0 text-zinc-500" />}
                                    <div className="min-w-0 flex-1">
                                        <div className="truncate text-sm font-medium text-zinc-800">{providerLabel(a.provider)}</div>
                                        <div className="truncate text-xs text-zinc-500">{email}</div>
                                    </div>
                                    <span className="shrink-0 text-xs text-zinc-400">{t('settings.connectedOn', { date: connectedDate(a.createdAt) })}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                <div className="mt-5">
                    <h4 className="text-sm font-semibold text-zinc-800">{ts('title')}</h4>
                    <p className="mt-0.5 text-sm text-zinc-500">{ts('desc')}</p>
                </div>
            </div>

            <ScrollArea className="min-h-0 flex-1" viewportClassName="h-full px-5 py-4">
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
            </ScrollArea>
        </div>
    )
}
