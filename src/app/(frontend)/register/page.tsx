'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button, Input, Label, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from 'eglador-ui-react'
import { toast } from 'eglador-ui-react-toast'
import { register, login } from '../_lib/api'
import { useTranslations } from 'next-intl'

export default function RegisterPage() {
    const t = useTranslations()
    const router = useRouter()
    const [firstName, setFirstName] = useState('')
    const [lastName, setLastName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        try {
            await register({ email, password, firstName: firstName || undefined, lastName: lastName || undefined })
            await login(email, password)
            toast.success(t('auth.registered'))
            router.replace('/chat')
            router.refresh()
        } catch (err) {
            toast.error((err as Error).message || t('common.somethingWentWrong'))
            setLoading(false)
        }
    }

    return (
        <main className="grid min-h-screen place-items-center px-4">
            <Card className="w-full max-w-sm">
                <CardHeader>
                    <CardTitle>{t('auth.registerTitle')}</CardTitle>
                    <CardDescription>{t('auth.registerSubtitle')}</CardDescription>
                </CardHeader>
                <form onSubmit={onSubmit}>
                    <CardContent className="flex flex-col gap-4">
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
            </Card>
        </main>
    )
}
