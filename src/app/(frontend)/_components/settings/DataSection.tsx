'use client'

import { useState } from 'react'
import {
    Button,
    Input,
    Label,
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
import { Download, Trash2, Brain, UserX } from 'lucide-react'
import { exportData, clearConversations, clearMemory, deleteAccount } from '../../_lib/api'
import { useTranslations } from 'next-intl'

type ConfirmAction = 'chats' | 'memory' | null

export default function DataSection() {
    const t = useTranslations()
    const [exporting, setExporting] = useState(false)
    const [busy, setBusy] = useState(false)
    const [confirm, setConfirm] = useState<ConfirmAction>(null)
    const [accountOpen, setAccountOpen] = useState(false)
    const [typed, setTyped] = useState('')
    const [deleting, setDeleting] = useState(false)

    const word = t('data.deleteAccountWord')
    const canDelete = typed.trim().toLocaleUpperCase('tr-TR') === word

    async function onDeleteAccount() {
        setDeleting(true)
        try {
            await deleteAccount()
            window.location.href = '/login'
        } catch (err) {
            toast.error((err as Error).message || t('common.somethingWentWrong'))
            setDeleting(false)
        }
    }

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

                    <div className="flex items-start justify-between gap-3 rounded-lg border border-zinc-200 px-4 py-3">
                        <div className="min-w-0">
                            <div className="flex items-center gap-2 text-sm font-medium text-zinc-800">
                                <Trash2 className="size-4" />
                                {t('data.clearTitle')}
                            </div>
                            <p className="mt-0.5 text-sm text-zinc-500">{t('data.clearDesc')}</p>
                        </div>
                        <Button variant="solid" size="sm" onClick={() => setConfirm('chats')}>
                            {t('data.clearCta')}
                        </Button>
                    </div>

                    <div className="flex items-start justify-between gap-3 rounded-lg border border-zinc-200 px-4 py-3">
                        <div className="min-w-0">
                            <div className="flex items-center gap-2 text-sm font-medium text-zinc-800">
                                <Brain className="size-4" />
                                {t('data.clearMemoryTitle')}
                            </div>
                            <p className="mt-0.5 text-sm text-zinc-500">{t('data.clearMemoryDesc')}</p>
                        </div>
                        <Button variant="solid" size="sm" onClick={() => setConfirm('memory')}>
                            {t('data.clearCta')}
                        </Button>
                    </div>

                    <div className="flex items-start justify-between gap-3 rounded-lg border border-zinc-200 px-4 py-3">
                        <div className="min-w-0">
                            <div className="flex items-center gap-2 text-sm font-medium text-zinc-800">
                                <UserX className="size-4" />
                                {t('data.deleteAccountTitle')}
                            </div>
                            <p className="mt-0.5 text-sm text-zinc-500">{t('data.deleteAccountDesc')}</p>
                        </div>
                        <Button variant="solid" size="sm" onClick={() => setAccountOpen(true)}>
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
                        <AlertDialogAction onClick={runConfirm} disabled={busy}>
                            {t('data.clearCta')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog
                open={accountOpen}
                onOpenChange={(o) => {
                    setAccountOpen(o)
                    if (!o) setTyped('')
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t('data.deleteAccountConfirmTitle')}</AlertDialogTitle>
                        <AlertDialogDescription>{t('data.deleteAccountDesc')}</AlertDialogDescription>
                    </AlertDialogHeader>
                    <ul className="list-disc space-y-1 pl-5 text-sm text-zinc-600">
                        <li>{t('data.deleteAccountWarn1')}</li>
                        <li>{t('data.deleteAccountWarn2')}</li>
                        <li>{t('data.deleteAccountWarn3')}</li>
                        <li>{t('data.deleteAccountWarn4')}</li>
                    </ul>
                    <div className="mt-3 flex flex-col gap-1.5">
                        <Label htmlFor="del-confirm">{t('data.deleteAccountTypeHint', { word })}</Label>
                        <Input id="del-confirm" value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" placeholder={word} />
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                        <AlertDialogAction onClick={onDeleteAccount} disabled={!canDelete || deleting}>
                            {t('data.deleteAccountTitle')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
