'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button, Input, Label, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from 'eglador-ui-react'
import { toast } from 'eglador-ui-react-toast'
import { login } from '../_lib/api'
import { useTranslations } from 'next-intl'
import GoogleSignIn from '../_components/GoogleSignIn'
import { useRecaptcha } from '../_lib/useRecaptcha'

export default function LoginPage() {
    const t = useTranslations()
    const router = useRouter()
    const { execute } = useRecaptcha()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (new URLSearchParams(window.location.search).get('error')) {
            toast.error(t('auth.oauthError'))
        }
    }, [t])

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        try {
            const token = await execute('login')
            await login(email, password, token)
            toast.success(t('auth.loggedIn'))
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
                    <CardTitle>{t('auth.loginTitle')}</CardTitle>
                    <CardDescription>{t('auth.loginSubtitle')}</CardDescription>
                </CardHeader>
                <form onSubmit={onSubmit}>
                    <CardContent className="flex flex-col gap-4 mb-4">
                        <GoogleSignIn />
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="email">{t('common.email')}</Label>
                            <Input id="email" type="email" required autoComplete="email" placeholder={t('auth.emailPlaceholder')} value={email} onChange={(e) => setEmail(e.target.value)} />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="password">{t('common.password')}</Label>
                            <Input id="password" type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col items-stretch gap-3">
                        <Button type="submit" variant="solid" loading={loading} className="w-full">
                            {t('auth.loginCta')}
                        </Button>
                        <div className="flex flex-col items-center gap-1.5">
                            <Link href="/forgot-password" className="text-sm text-zinc-500 hover:text-zinc-800">
                                {t('auth.forgotLink')}
                            </Link>
                            <Link href="/register" className="text-sm text-zinc-500 hover:text-zinc-800">
                                {t('auth.toRegister')}
                            </Link>
                        </div>
                    </CardFooter>
                </form>
            </Card>
        </main>
    )
}
