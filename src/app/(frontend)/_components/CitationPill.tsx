'use client'

import { HoverCard, HoverCardTrigger, HoverCardContent } from 'eglador-ui-react'
import type { Citation } from '../_lib/sse'
import { sourceInfo, formatCiteDate } from '../_lib/source'

export default function CitationPill({ citation }: { citation: Citation }) {
    const info = sourceInfo(citation.url)
    const n = citation.n ?? citation.index

    if (!info) {
        return (
            <sup className="mx-0.5 rounded bg-zinc-100 px-1 text-[0.7em] font-semibold text-zinc-500">{n}</sup>
        )
    }

    const date = formatCiteDate(citation.publishedAt)

    return (
        <HoverCard openDelay={120} closeDelay={100}>
            <HoverCardTrigger asChild>
                <a
                    href={info.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mx-0.5 inline-flex max-w-[11rem] translate-y-[-1px] items-center gap-1 rounded-full border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 align-middle text-[0.72em] font-medium leading-none text-zinc-600 no-underline transition hover:border-zinc-300 hover:bg-zinc-100 hover:text-zinc-900"
                >
                    <img src={info.favicon} alt="" width={12} height={12} loading="lazy" className="size-3 shrink-0 rounded-[3px]" />
                    <span className="truncate">{info.brand}</span>
                </a>
            </HoverCardTrigger>
            <HoverCardContent className="w-80 rounded-xl border border-zinc-200 bg-white p-3 text-left shadow-lg">
                <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                    <img src={info.favicon} alt="" width={16} height={16} loading="lazy" className="size-4 rounded-[3px]" />
                    <span className="font-medium text-zinc-700">{info.brand}</span>
                    {date && (
                        <>
                            <span>·</span>
                            <span>{date}</span>
                        </>
                    )}
                </div>
                {citation.title && (
                    <div className="mt-1.5 text-sm font-semibold leading-snug text-zinc-900">{citation.title}</div>
                )}
                {citation.snippet && (
                    <p className="mt-1 text-xs leading-relaxed text-zinc-500">{citation.snippet}</p>
                )}
                <a
                    href={info.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-block text-xs font-medium text-indigo-600 hover:text-indigo-700"
                >
                    Kaynağı aç ↗
                </a>
            </HoverCardContent>
        </HoverCard>
    )
}
