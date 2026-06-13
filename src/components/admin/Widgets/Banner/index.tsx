import type { WidgetServerProps } from 'payload'
import Image from 'next/image'

export default async function BannerWidget({ req }: WidgetServerProps) {

    // Format date in Turkish
    const today = new Intl.DateTimeFormat('tr-TR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }).format(new Date())

    return (
        <div className="w-full bg-white border border-zinc-200 rounded-md p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden group">

            <div className="absolute top-0 right-0 w-64 h-64 bg-zinc-50 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none opacity-50 text-zinc-100" />

            <div className="flex flex-col gap-2 relative z-10 text-center md:text-left">
                <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                    {today}
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-zinc-900 tracking-tight">
                    Hoş Geldiniz! 👋
                </h2>
                <p className="text-zinc-500 max-w-lg">
                    Gleam'e hoş geldiniz! Dashboard'unuzu keşfedin, yeni özellikleri deneyimleyin ve bize geri bildirimde bulunun. Harika bir deneyim için buradayız!
                </p>
            </div>

            <div className="relative z-10 shrink-0 p-4">
                <Image
                    src="/assets/images/symbol/symbol-black.svg"
                    alt="Gleam Logo"
                    width={180}
                    height={60}
                    className="h-12 w-auto object-contain md:h-16"
                    priority
                />
            </div>
        </div>
    )
}
