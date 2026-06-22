'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button, Input, Label, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from 'eglador-ui-react'
import { toast } from 'eglador-ui-react-toast'
import { CircleCheck } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { resetPassword } from '../_lib/api'

export default function ResetPasswordPage() {
    const t = useTranslations()
    const router = useRouter()
    const [token, setToken] = useState('')
    const [password, setPassword] = useState('')
    const [confirm, setConfirm] = useState('')
    const [loading, setLoading] = useState(false)
    const [done, setDone] = useState(false)

    useEffect(() => {
        setToken(new URLSearchParams(window.location.search).get('token') || '')
    }, [])

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!token) {
            toast.error(t('auth.invalidLink'))
            return
        }
        if (password !== confirm) {
            toast.error(t('auth.passwordMismatch'))
            return
        }
        setLoading(true)
        try {
            await resetPassword(token, password)
            setDone(true)
        } catch (err) {
            toast.error((err as Error).message || t('common.somethingWentWrong'))
            setLoading(false)
        }
    }

    return (
        <main className="grid min-h-screen place-items-center px-4">
            <Card className="w-full max-w-sm">
                {done ? (
                    <>
                        <CardHeader className="text-center">
                            <div className="mx-auto mb-3 grid size-14 place-items-center rounded-full bg-emerald-50">
                                <CircleCheck className="size-7 text-emerald-600" />
                            </div>
                            <CardTitle>{t('auth.resetDoneTitle')}</CardTitle>
                            <CardDescription>{t('auth.resetDone')}</CardDescription>
                        </CardHeader>
                        <CardFooter>
                            <Button variant="solid" className="w-full" onClick={() => router.replace('/login')}>
                                {t('auth.loginCta')}
                            </Button>
                        </CardFooter>
                    </>
                ) : (
                    <>
                        <CardHeader>
                            <CardTitle>{t('auth.resetTitle')}</CardTitle>
                            <CardDescription>{t('auth.resetSubtitle')}</CardDescription>
                        </CardHeader>
                        <form onSubmit={onSubmit}>
                            <CardContent className="flex flex-col gap-4">
                                <div className="flex flex-col gap-1.5">
                                    <Label htmlFor="password">{t('auth.newPassword')}</Label>
                                    <Input id="password" type="password" required minLength={8} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
                                    <span className="text-xs text-zinc-400">{t('auth.passwordHint')}</span>
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <Label htmlFor="confirm">{t('auth.confirmPassword')}</Label>
                                    <Input
                                        id="confirm"
                                        type="password"
                                        required
                                        minLength={8}
                                        autoComplete="new-password"
                                        value={confirm}
                                        onChange={(e) => setConfirm(e.target.value)}
                                        className={confirm.length > 0 && confirm !== password ? 'border-rose-400' : undefined}
                                    />
                                    {confirm.length > 0 && confirm !== password && (
                                        <span className="text-xs text-rose-600">{t('auth.passwordMismatch')}</span>
                                    )}
                                </div>
                            </CardContent>
                            <CardFooter className="flex flex-col items-stretch gap-3">
                                <Button type="submit" variant="solid" loading={loading} className="w-full">
                                    {t('auth.resetCta')}
                                </Button>
                                <Link href="/login" className="text-center text-sm text-zinc-500 hover:text-zinc-800">
                                    {t('auth.backToLogin')}
                                </Link>
                            </CardFooter>
                        </form>
                    </>
                )}
            </Card>
        </main>
    )
}
