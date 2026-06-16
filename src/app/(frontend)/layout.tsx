import React from 'react'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages } from 'next-intl/server'
import { getCachedGlobal } from '@/utilities/getCachedGlobal'
import './styles.css'
import AppToaster from './_components/AppToaster'

const loadTheme = () => getCachedGlobal('theme', 0)().catch(() => null)

export async function generateMetadata() {
    const theme = await loadTheme()
    const name = theme?.name || 'Arwenis'
    return {
        title: { default: name, template: `%s · ${name}` },
        description: `${name} — bilgi tabanlı yapay zekâ asistanı.`,
    }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
    const theme = await loadTheme()
    const brand = theme?.brandColor || '#4f46e5'
    const locale = await getLocale()
    const messages = await getMessages()

    return (
        <html lang={locale} style={{ ['--brand' as string]: brand } as React.CSSProperties}>
            <body className="min-h-screen bg-zinc-50 text-zinc-900">
                <NextIntlClientProvider locale={locale} messages={messages}>
                    {children}
                    <AppToaster />
                </NextIntlClientProvider>
            </body>
        </html>
    )
}
