'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Button, Input, Label, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from 'eglador-ui-react'
import { toast } from 'eglador-ui-react-toast'
import { MailCheck } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { forgotPassword } from '../_lib/api'
import { useRecaptcha } from '../_lib/useRecaptcha'

export default function ForgotPasswordPage() {
    const t = useTranslations()
    const { execute } = useRecaptcha()
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [sent, setSent] = useState(false)

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        try {
            const token = await execute('forgot_password')
            await forgotPassword(email, token)
            setSent(true)
        } catch (err) {
            toast.error((err as Error).message || t('common.somethingWentWrong'))
        } finally {
            setLoading(false)
        }
    }

    return (
        <main className="grid min-h-screen place-items-center px-4">
            <Card className="w-full max-w-sm">
                {sent ? (
                    <>
                        <CardHeader className="text-center">
                            <div className="mx-auto mb-3 grid size-14 place-items-center rounded-full bg-indigo-50">
                                <MailCheck className="size-7 text-indigo-600" />
                            </div>
                            <CardTitle>{t('auth.forgotSentTitle')}</CardTitle>
                            <CardDescription>{t('auth.forgotSent')}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-center text-sm font-medium text-zinc-700">
                                {email}
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Link href="/login" className="w-full text-center text-sm text-zinc-500 hover:text-zinc-800">
                                {t('auth.backToLogin')}
                            </Link>
                        </CardFooter>
                    </>
                ) : (
                    <>
                        <CardHeader>
                            <CardTitle>{t('auth.forgotTitle')}</CardTitle>
                            <CardDescription>{t('auth.forgotSubtitle')}</CardDescription>
                        </CardHeader>
                        <form onSubmit={onSubmit}>
                            <CardContent className="flex flex-col gap-4">
                                <div className="flex flex-col gap-1.5 mb-4">
                                    <Label htmlFor="email">{t('common.email')}</Label>
                                    <Input id="email" type="email" required autoComplete="email" placeholder={t('auth.emailPlaceholder')} value={email} onChange={(e) => setEmail(e.target.value)} />
                                </div>
                            </CardContent>
                            <CardFooter className="flex flex-col items-stretch gap-3">
                                <Button type="submit" variant="solid" loading={loading} className="w-full">
                                    {t('auth.forgotCta')}
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
