'use client'

import { useEffect, useState } from 'react'
import { Button, Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, ScrollArea } from 'eglador-ui-react'
import { toast } from 'eglador-ui-react-toast'
import { Brain, Trash2 } from 'lucide-react'
import { listMemory, deleteMemory, clearMemory, type MemoryLite } from '../../_lib/api'
import { useTranslations } from 'next-intl'

export default function MemorySection() {
    const t = useTranslations()
    const [items, setItems] = useState<MemoryLite[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let active = true
        setLoading(true)
        listMemory().then((d) => {
            if (!active) return
            setItems(d)
            setLoading(false)
        })
        return () => {
            active = false
        }
    }, [])

    async function removeOne(id: string) {
        setItems((x) => x.filter((m) => m.id !== id))
        await deleteMemory(id)
    }

    async function clearAll() {
        setItems([])
        await clearMemory()
        toast.success(t('memory.cleared'))
    }

    return (
        <div className="flex h-full flex-col">
            <div className="flex shrink-0 items-start justify-between gap-3 border-b border-zinc-100 px-5 pb-3 pt-5">
                <div>
                    <h3 className="text-base font-semibold text-zinc-800">{t('memory.title')}</h3>
                    <p className="mt-0.5 text-sm text-zinc-500">{t('memory.subtitle')}</p>
                </div>
                {items.length > 0 && (
                    <Button variant="ghost" size="sm" className="shrink-0 text-rose-600" onClick={clearAll}>
                        {t('memory.clearAll')}
                    </Button>
                )}
            </div>

            <ScrollArea className="min-h-0 flex-1" viewportClassName="h-full px-5 py-4">
                {loading ? (
                    <p className="py-6 text-center text-sm text-zinc-400">{t('common.loading')}</p>
                ) : items.length === 0 ? (
                    <Empty className="py-8">
                        <EmptyHeader>
                            <EmptyMedia variant="icon">
                                <Brain />
                            </EmptyMedia>
                            <EmptyTitle>{t('memory.empty')}</EmptyTitle>
                            <EmptyDescription>{t('memory.emptyDesc')}</EmptyDescription>
                        </EmptyHeader>
                    </Empty>
                ) : (
                    <ul className="space-y-1.5">
                        {items.map((m) => (
                            <li
                                key={m.id}
                                className="flex items-start gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-700"
                            >
                                <span className="flex-1">{m.text}</span>
                                <button
                                    onClick={() => removeOne(m.id)}
                                    className="shrink-0 rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-rose-600"
                                    aria-label={t('chat.delete')}
                                >
                                    <Trash2 className="size-3.5" />
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </ScrollArea>
        </div>
    )
}
