import type { Citation } from '../_lib/sse'
import { sourceInfo } from '../_lib/source'

export default function SourceChips({ citations }: { citations?: Citation[] }) {
    if (!citations || citations.length === 0) return null
    return (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {citations.map((c, i) => {
                const info = sourceInfo(c.url)
                const label = c.title?.trim() || info?.brand || `Kaynak ${c.index ?? c.n ?? i + 1}`
                const content = (
                    <>
                        {info ? (
                            <img src={info.favicon} alt="" width={14} height={14} loading="lazy" className="size-3.5 shrink-0 rounded-[3px]" />
                        ) : (
                            <span className="text-zinc-400">[{c.index ?? c.n ?? i + 1}]</span>
                        )}
                        <span className="max-w-[14rem] truncate">{label}</span>
                    </>
                )
                return info ? (
                    <a
                        key={i}
                        href={info.href}
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
