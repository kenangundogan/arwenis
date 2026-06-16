'use client'

import { useMemo } from 'react'
import { marked } from 'marked'
import DOMPurify from 'dompurify'

export default function Markdown({ content }: { content: string }) {
    const html = useMemo(() => {
        const raw = marked.parse(content, { async: false, breaks: true, gfm: true }) as string
        return DOMPurify.sanitize(raw, { ADD_ATTR: ['target', 'rel'] })
    }, [content])

    return <div className="markdown" dangerouslySetInnerHTML={{ __html: html }} />
}
