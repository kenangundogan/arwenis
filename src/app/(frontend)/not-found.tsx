import Link from 'next/link'
import { getTranslations } from 'next-intl/server'

export default async function NotFound() {
    const t = await getTranslations('notFound')
    return (
        <main className="grid min-h-screen place-items-center px-4 text-center">
            <div className="flex flex-col items-center gap-3">
                <p className="text-6xl font-bold text-zinc-200">404</p>
                <h1 className="text-lg font-semibold text-zinc-800">{t('title')}</h1>
                <p className="max-w-sm text-sm text-zinc-500">{t('desc')}</p>
                <Link
                    href="/chat"
                    className="mt-2 rounded-lg px-4 py-2 text-sm font-medium text-white"
                    style={{ backgroundColor: 'var(--brand)' }}
                >
                    {t('back')}
                </Link>
            </div>
        </main>
    )
}
