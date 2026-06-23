'use client'

import { useEffect, useState } from 'react'
import { NativeSelect, Label, ScrollArea } from 'eglador-ui-react'
import { toast } from 'eglador-ui-react-toast'
import { getMe, updateProfile } from '../../_lib/api'
import { useTranslations } from 'next-intl'

export default function GeneralSection() {
    const t = useTranslations()
    const [id, setId] = useState('')
    const [locale, setLocale] = useState('tr')
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let active = true
        getMe().then((m) => {
            if (!active) return
            if (m) {
                setId(String(m.id))
                setLocale(m.locale || 'tr')
            }
            setLoading(false)
        })
        return () => {
            active = false
        }
    }, [])

    async function onLocale(v: string) {
        setLocale(v)
        if (!id) return
        try {
            await updateProfile(id, { locale: v })
            toast.success(t('general.saved'))
        } catch (err) {
            toast.error((err as Error).message || t('common.somethingWentWrong'))
        }
    }

    return (
        <div className="flex h-full flex-col">
            <div className="shrink-0 border-b border-zinc-100 px-5 pb-3 pt-5">
                <h3 className="text-base font-semibold text-zinc-800">{t('settings.general')}</h3>
                <p className="mt-0.5 text-sm text-zinc-500">{t('general.subtitle')}</p>
            </div>
            <ScrollArea className="min-h-0 flex-1" viewportClassName="h-full px-5 py-4">
                <div className="flex max-w-xs flex-col gap-1.5">
                    <Label htmlFor="g-locale">{t('general.language')}</Label>
                    <NativeSelect id="g-locale" value={locale} disabled={loading} onChange={(e) => onLocale(e.target.value)}>
                        <option value="tr">Türkçe</option>
                        <option value="en" disabled>
                            English ({t('general.soonLang')})
                        </option>
                    </NativeSelect>
                    <p className="text-xs text-zinc-400">{t('general.languageHint')}</p>
                </div>
            </ScrollArea>
        </div>
    )
}
