'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import {
    ScrollArea,
    Empty,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
    EmptyDescription,
} from 'eglador-ui-react'
import { BarChart3, MessageCircle, Coins, MessagesSquare, ArrowUp, ArrowDown } from 'lucide-react'
import { BarChart } from 'eglador-ui-react-chart'
import { getUsageStats, type UsageStats } from '../../_lib/api'

const nf = new Intl.NumberFormat('tr-TR')
const cf = new Intl.NumberFormat('tr-TR', { notation: 'compact', maximumFractionDigits: 1 })
const fmt = (n: number): string => (n >= 10_000 ? cf.format(n) : nf.format(n))

const shortDate = (day: string): string =>
    new Date(day + 'T00:00:00.000Z').toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' })

function StatCard({
    icon,
    label,
    value,
    up,
    down,
}: {
    icon: React.ReactNode
    label: string
    value: string
    up?: { label: string; value: string }
    down?: { label: string; value: string }
}) {
    return (
        <div className="rounded-lg border border-zinc-200 px-4 py-3">
            <div className="flex items-center gap-2 text-sm font-medium text-zinc-500">
                {icon}
                {label}
            </div>
            <div className="mt-1 text-2xl font-semibold tabular-nums text-zinc-800">{value}</div>
            {(up || down) && (
                <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-zinc-500">
                    {up && (
                        <span className="inline-flex items-center gap-0.5">
                            <ArrowUp className="size-3" />
                            <span className="tabular-nums font-medium text-zinc-700">{up.value}</span> {up.label}
                        </span>
                    )}
                    {down && (
                        <span className="inline-flex items-center gap-0.5">
                            <ArrowDown className="size-3" />
                            <span className="tabular-nums font-medium text-zinc-700">{down.value}</span> {down.label}
                        </span>
                    )}
                </div>
            )}
        </div>
    )
}

export default function UsageSection() {
    const t = useTranslations()
    const tu = useTranslations('usage')
    const [stats, setStats] = useState<UsageStats | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let active = true
        setLoading(true)
        getUsageStats()
            .then((s) => {
                if (!active) return
                setStats(s)
            })
            .finally(() => {
                if (active) setLoading(false)
            })
        return () => {
            active = false
        }
    }, [])

    const empty = !loading && (!stats || stats.totalMessages === 0)
    const chartData = (stats?.daily ?? []).map((d) => ({ label: shortDate(d.day), messages: d.messages }))

    return (
        <div className="flex h-full flex-col">
            <div className="shrink-0 border-b border-zinc-100 px-5 pb-3 pt-5">
                <h3 className="text-base font-semibold text-zinc-800">{t('settings.usage')}</h3>
                <p className="mt-0.5 text-sm text-zinc-500">{tu('subtitle')}</p>
            </div>

            <ScrollArea className="min-h-0 flex-1" viewportClassName="h-full px-5 py-4">
                {loading ? (
                    <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="h-22 animate-pulse rounded-lg bg-zinc-100" />
                            <div className="h-22 animate-pulse rounded-lg bg-zinc-100" />
                        </div>
                        <div className="h-18 animate-pulse rounded-lg bg-zinc-100" />
                        <div className="h-32 animate-pulse rounded-lg bg-zinc-100" />
                    </div>
                ) : empty ? (
                    <Empty className="py-8">
                        <EmptyHeader>
                            <EmptyMedia variant="icon">
                                <BarChart3 />
                            </EmptyMedia>
                            <EmptyTitle>{tu('empty')}</EmptyTitle>
                            <EmptyDescription>{tu('emptyDesc')}</EmptyDescription>
                        </EmptyHeader>
                    </Empty>
                ) : (
                    stats && (
                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <StatCard
                                    icon={<MessageCircle className="size-4" />}
                                    label={tu('messages')}
                                    value={fmt(stats.totalMessages)}
                                    up={{ value: fmt(stats.userMessages), label: tu('sent') }}
                                    down={{ value: fmt(stats.assistantMessages), label: tu('replies') }}
                                />
                                <StatCard
                                    icon={<Coins className="size-4" />}
                                    label={tu('tokens')}
                                    value={fmt(stats.totalTokens)}
                                    up={{ value: fmt(stats.tokensIn), label: tu('tokensIn') }}
                                    down={{ value: fmt(stats.tokensOut), label: tu('tokensOut') }}
                                />
                            </div>

                            <StatCard
                                icon={<MessagesSquare className="size-4" />}
                                label={tu('conversations')}
                                value={fmt(stats.conversations)}
                            />

                            <div className="rounded-lg border border-zinc-200 px-4 py-3">
                                <div className="text-sm font-medium text-zinc-500">{tu('last30Days')}</div>
                                <div className="mt-3 h-36">
                                    <BarChart
                                        data={chartData}
                                        xKey="label"
                                        series={[{ key: 'messages', label: tu('messages'), color: '#3f3f46' }]}
                                        responsive
                                        height={144}
                                        radius={3}
                                        showGrid={false}
                                        showYAxis={false}
                                        showLegend={false}
                                        showTooltip
                                    />
                                </div>
                            </div>
                        </div>
                    )
                )}
            </ScrollArea>
        </div>
    )
}
