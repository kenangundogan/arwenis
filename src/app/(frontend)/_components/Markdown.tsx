'use client'

import { useMemo } from 'react'
import ReactMarkdown, { defaultUrlTransform } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'
import type { Citation } from '../_lib/sse'
import CitationPill from './CitationPill'

const preprocess = (content: string, count: number): string =>
    content.replace(/\[(\d{1,3})\]/g, (m, d: string) => {
        const n = parseInt(d, 10)
        return n >= 1 && n <= count ? `[${d}](cite:${d})` : m
    })

export default function Markdown({ content, citations }: { content: string; citations?: Citation[] }) {
    const text = useMemo(
        () => (citations?.length ? preprocess(content, citations.length) : content),
        [content, citations],
    )

    return (
        <div className="markdown">
            <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkBreaks]}
                urlTransform={(url) => (url.startsWith('cite:') ? url : defaultUrlTransform(url))}
                components={{
                    a({ href, children, node: _node, ...props }) {
                        if (href?.startsWith('cite:') && citations) {
                            const c = citations[parseInt(href.slice(5), 10) - 1]
                            if (c) return <CitationPill citation={c} />
                        }
                        return (
                            <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
                                {children}
                            </a>
                        )
                    },
                }}
            >
                {text}
            </ReactMarkdown>
        </div>
    )
}
