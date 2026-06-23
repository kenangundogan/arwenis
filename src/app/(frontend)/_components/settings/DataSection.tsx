'use client'

import { useState } from 'react'
import {
    Button,
    ScrollArea,
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogCancel,
    AlertDialogAction,
} from 'eglador-ui-react'
import { toast } from 'eglador-ui-react-toast'
import { Download, Trash2, Brain } from 'lucide-react'
import { exportData, clearConversations, clearMemory } from '../../_lib/api'
import { useTranslations } from 'next-intl'

type ConfirmAction = 'chats' | 'memory' | null

export default function DataSection() {
    const t = useTranslations()
    const [exporting, setExporting] = useState(false)
    const [busy, setBusy] = useState(false)
    const [confirm, setConfirm] = useState<ConfirmAction>(null)

    async function onExport() {
        setExporting(true)
        try {
            await exportData()
        } catch (err) {
            toast.error((err as Error).message || t('common.somethingWentWrong'))
        } finally {
            setExporting(false)
        }
    }

    async function runConfirm() {
        if (!confirm) return
        setBusy(true)
        try {
            if (confirm === 'chats') {
                await clearConversations()
                window.dispatchEvent(new CustomEvent('arwenis:conversations-changed'))
                toast.success(t('data.cleared'))
            } else {
                await clearMemory()
                toast.success(t('data.memoryCleared'))
            }
            setConfirm(null)
        } catch (err) {
            toast.error((err as Error).message || t('common.somethingWentWrong'))
        } finally {
            setBusy(false)
        }
    }

    const dialog =
        confirm === 'memory'
            ? { title: t('data.clearMemoryConfirmTitle'), desc: t('data.clearMemoryConfirmDesc') }
            : { title: t('data.clearConfirmTitle'), desc: t('data.clearConfirmDesc') }

    return (
        <div className="flex h-full flex-col">
            <div className="shrink-0 border-b border-zinc-100 px-5 pb-3 pt-5">
                <h3 className="text-base font-semibold text-zinc-800">{t('data.title')}</h3>
                <p className="mt-0.5 text-sm text-zinc-500">{t('data.subtitle')}</p>
            </div>

            <ScrollArea className="min-h-0 flex-1" viewportClassName="h-full px-5 py-4">
                <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3 rounded-lg border border-zinc-200 px-4 py-3">
                        <div className="min-w-0">
                            <div className="flex items-center gap-2 text-sm font-medium text-zinc-800">
                                <Download className="size-4" />
                                {t('data.exportTitle')}
                            </div>
                            <p className="mt-0.5 text-sm text-zinc-500">{t('data.exportDesc')}</p>
                        </div>
                        <Button variant="outline" size="sm" loading={exporting} onClick={onExport} className="shrink-0">
                            {t('data.exportCta')}
                        </Button>
                    </div>

                    <div className="flex items-start justify-between gap-3 rounded-lg border border-rose-200 bg-rose-50/40 px-4 py-3">
                        <div className="min-w-0">
                            <div className="flex items-center gap-2 text-sm font-medium text-rose-700">
                                <Trash2 className="size-4" />
                                {t('data.clearTitle')}
                            </div>
                            <p className="mt-0.5 text-sm text-zinc-500">{t('data.clearDesc')}</p>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => setConfirm('chats')} className="shrink-0 border-rose-300 text-rose-600 hover:bg-rose-50">
                            {t('data.clearCta')}
                        </Button>
                    </div>

                    <div className="flex items-start justify-between gap-3 rounded-lg border border-rose-200 bg-rose-50/40 px-4 py-3">
                        <div className="min-w-0">
                            <div className="flex items-center gap-2 text-sm font-medium text-rose-700">
                                <Brain className="size-4" />
                                {t('data.clearMemoryTitle')}
                            </div>
                            <p className="mt-0.5 text-sm text-zinc-500">{t('data.clearMemoryDesc')}</p>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => setConfirm('memory')} className="shrink-0 border-rose-300 text-rose-600 hover:bg-rose-50">
                            {t('data.clearCta')}
                        </Button>
                    </div>
                </div>
            </ScrollArea>

            <AlertDialog open={confirm !== null} onOpenChange={(o) => !o && setConfirm(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{dialog.title}</AlertDialogTitle>
                        <AlertDialogDescription>{dialog.desc}</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                        <AlertDialogAction onClick={runConfirm} disabled={busy} className="bg-rose-600 text-white hover:bg-rose-700">
                            {t('data.clearCta')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
