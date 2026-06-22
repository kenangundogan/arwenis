'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button, Card, CardHeader, CardTitle, CardContent, Spinner } from 'eglador-ui-react'
import { useTranslations } from 'next-intl'
import { verifyEmail } from '../_lib/api'

type Status = 'verifying' | 'ok' | 'fail'

export default function VerifyEmailPage() {
    const t = useTranslations()
    const router = useRouter()
    const [status, setStatus] = useState<Status>('verifying')

    useEffect(() => {
        const token = new URLSearchParams(window.location.search).get('token')
        if (!token) {
            setStatus('fail')
            return
        }
        let active = true
        verifyEmail(token)
            .then(() => active && setStatus('ok'))
            .catch(() => active && setStatus('fail'))
        return () => {
            active = false
        }
    }, [])

    return (
        <main className="grid min-h-screen place-items-center px-4">
            <Card className="w-full max-w-sm">
                <CardHeader>
                    <CardTitle>{t('auth.verifyTitle')}</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-stretch gap-4">
                    {status === 'verifying' && (
                        <div className="flex items-center gap-2 text-sm text-zinc-500">
                            <Spinner size="sm" /> {t('auth.verifying')}
                        </div>
                    )}
                    {status === 'ok' && (
                        <>
                            <p className="text-sm text-emerald-700">{t('auth.verified')}</p>
                            <Button variant="solid" className="w-full" onClick={() => router.replace('/login')}>
                                {t('auth.loginCta')}
                            </Button>
                        </>
                    )}
                    {status === 'fail' && (
                        <>
                            <p className="text-sm text-rose-700">{t('auth.verifyFailed')}</p>
                            <Link href="/login" className="text-center text-sm text-zinc-500 hover:text-zinc-800">
                                {t('auth.backToLogin')}
                            </Link>
                        </>
                    )}
                </CardContent>
            </Card>
        </main>
    )
}
