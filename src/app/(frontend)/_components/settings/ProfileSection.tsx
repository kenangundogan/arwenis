'use client'

import { useEffect, useState } from 'react'
import { Button, Input, Label } from 'eglador-ui-react'
import { toast } from 'eglador-ui-react-toast'
import { getMe, updateProfile } from '../../_lib/api'
import { useTranslations } from 'next-intl'

export default function ProfileSection() {
    const t = useTranslations()
    const [id, setId] = useState('')
    const [email, setEmail] = useState('')
    const [firstName, setFirstName] = useState('')
    const [lastName, setLastName] = useState('')
    const [gsm, setGsm] = useState('')
    const [locale, setLocale] = useState('')
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        let active = true
        setLoading(true)
        getMe().then((m) => {
            if (!active) return
            if (m) {
                setId(String(m.id))
                setEmail(m.email ?? '')
                setFirstName(m.firstName ?? '')
                setLastName(m.lastName ?? '')
                setGsm(m.gsm ?? '')
                setLocale(m.locale ?? '')
            }
            setLoading(false)
        })
        return () => {
            active = false
        }
    }, [])

    async function save() {
        if (!id) return
        setSaving(true)
        try {
            await updateProfile(id, {
                firstName: firstName || undefined,
                lastName: lastName || undefined,
                gsm: gsm || undefined,
                locale: locale || undefined,
            })
            toast.success(t('profile.saved'))
        } catch (err) {
            toast.error((err as Error).message || t('common.somethingWentWrong'))
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="flex h-full flex-col">
            <div>
                <h3 className="text-base font-semibold text-zinc-800">{t('profile.title')}</h3>
                <p className="mt-0.5 text-sm text-zinc-500">{t('profile.subtitle')}</p>
            </div>
            <div className="mt-4 grid gap-3">
                <div className="flex flex-col gap-1.5">
                    <Label htmlFor="p-email">{t('common.email')}</Label>
                    <Input id="p-email" value={email} disabled readOnly />
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="p-first">{t('common.firstName')}</Label>
                        <Input id="p-first" value={firstName} disabled={loading} onChange={(e) => setFirstName(e.target.value)} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="p-last">{t('common.lastName')}</Label>
                        <Input id="p-last" value={lastName} disabled={loading} onChange={(e) => setLastName(e.target.value)} />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="p-gsm">{t('profile.gsm')}</Label>
                        <Input id="p-gsm" value={gsm} disabled={loading} placeholder="5XX XXX XXXX" onChange={(e) => setGsm(e.target.value)} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="p-locale">{t('profile.locale')}</Label>
                        <Input id="p-locale" value={locale} disabled={loading} placeholder="tr" onChange={(e) => setLocale(e.target.value)} />
                    </div>
                </div>
            </div>
            <div className="mt-auto flex justify-end pt-4">
                <Button variant="solid" loading={saving} disabled={loading} onClick={save}>
                    {t('profile.save')}
                </Button>
            </div>
        </div>
    )
}
