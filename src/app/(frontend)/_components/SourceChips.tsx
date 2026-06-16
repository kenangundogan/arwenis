import { ExternalLink } from 'lucide-react'
import type { Citation } from '../_lib/sse'

const domain = (url?: string): string | null => {
    if (!url) return null
    try {
        const u = new URL(url)
        if (u.protocol !== 'http:' && u.protocol !== 'https:') return null
        return u.hostname.replace(/^www\./, '')
    } catch {
        return null
    }
}

export default function SourceChips({ citations }: { citations?: Citation[] }) {
    if (!citations || citations.length === 0) return null
    return (
        <div className="mt-2 flex flex-wrap gap-1.5">
            {citations.map((c, i) => {
                const host = domain(c.url)
                const label = c.title?.trim() || host || `Kaynak ${c.index ?? c.n ?? i + 1}`
                const content = (
                    <>
                        <span className="text-zinc-400">[{c.index ?? c.n ?? i + 1}]</span>
                        <span className="max-w-[14rem] truncate">{label}</span>
                        {host && <ExternalLink className="size-3 shrink-0 text-zinc-400" />}
                    </>
                )
                return host && c.url ? (
                    <a
                        key={i}
                        href={c.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-xs text-zinc-600 transition hover:border-zinc-300 hover:text-zinc-900"
                    >
                        {content}
                    </a>
                ) : (
                    <span
                        key={i}
                        className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-xs text-zinc-600"
                    >
                        {content}
                    </span>
                )
            })}
        </div>
    )
}
