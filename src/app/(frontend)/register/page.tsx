'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Button, Input, Label, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from 'eglador-ui-react'
import { toast } from 'eglador-ui-react-toast'
import { MailCheck } from 'lucide-react'
import { register } from '../_lib/api'
import { useTranslations } from 'next-intl'
import GoogleSignIn from '../_components/GoogleSignIn'
import { useRecaptcha } from '../_lib/useRecaptcha'

export default function RegisterPage() {
    const t = useTranslations()
    const { execute } = useRecaptcha()
    const [firstName, setFirstName] = useState('')
    const [lastName, setLastName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirm, setConfirm] = useState('')
    const [loading, setLoading] = useState(false)
    const [done, setDone] = useState(false)

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (password !== confirm) {
            toast.error(t('auth.passwordMismatch'))
            return
        }
        setLoading(true)
        try {
            const token = await execute('register')
            await register({ email, password, firstName: firstName || undefined, lastName: lastName || undefined }, token)
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
                            <div className="mx-auto mb-3 grid size-14 place-items-center rounded-full bg-indigo-50">
                                <MailCheck className="size-7 text-indigo-600" />
                            </div>
                            <CardTitle>{t('auth.checkEmailTitle')}</CardTitle>
                            <CardDescription>{t('auth.registeredVerify')}</CardDescription>
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
                            <CardTitle>{t('auth.registerTitle')}</CardTitle>
                            <CardDescription>{t('auth.registerSubtitle')}</CardDescription>
                        </CardHeader>
                        <form onSubmit={onSubmit}>
                            <CardContent className="flex flex-col gap-4 mb-4">
                                <GoogleSignIn />
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="flex flex-col gap-1.5">
                                        <Label htmlFor="firstName">{t('common.firstName')}</Label>
                                        <Input id="firstName" autoComplete="given-name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <Label htmlFor="lastName">{t('common.lastName')}</Label>
                                        <Input id="lastName" autoComplete="family-name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                                    </div>
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <Label htmlFor="email">{t('common.email')}</Label>
                                    <Input id="email" type="email" required autoComplete="email" placeholder={t('auth.emailPlaceholder')} value={email} onChange={(e) => setEmail(e.target.value)} />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <Label htmlFor="password">{t('common.password')}</Label>
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
                                    {t('auth.registerCta')}
                                </Button>
                                <Link href="/login" className="text-center text-sm text-zinc-500 hover:text-zinc-800">
                                    {t('auth.toLogin')}
                                </Link>
                            </CardFooter>
                        </form>
                    </>
                )}
            </Card>
        </main>
    )
}
