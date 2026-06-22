'use client'

import { useCallback, useEffect, useState } from 'react'

type Grecaptcha = {
    ready: (cb: () => void) => void
    execute: (siteKey: string, opts: { action: string }) => Promise<string>
}

let scriptPromise: Promise<void> | null = null

const loadScript = (siteKey: string): Promise<void> => {
    if (scriptPromise) return scriptPromise
    scriptPromise = new Promise<void>((resolve, reject) => {
        const existing = document.querySelector<HTMLScriptElement>('script[data-recaptcha]')
        if (existing) {
            resolve()
            return
        }
        const script = document.createElement('script')
        script.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(siteKey)}`
        script.async = true
        script.defer = true
        script.dataset.recaptcha = 'true'
        script.onload = () => resolve()
        script.onerror = () => reject(new Error('recaptcha-load-failed'))
        document.head.appendChild(script)
    })
    return scriptPromise
}

export function useRecaptcha() {
    const [siteKey, setSiteKey] = useState<string | null>(null)

    useEffect(() => {
        let active = true
        fetch('/api/assistant/auth/providers')
            .then((r) => (r.ok ? r.json() : null))
            .then((d) => {
                if (!active) return
                const rc = d?.recaptcha
                if (rc?.enabled && rc.siteKey) {
                    setSiteKey(rc.siteKey)
                    loadScript(rc.siteKey).catch(() => {})
                }
            })
            .catch(() => {})
        return () => {
            active = false
        }
    }, [])

    const execute = useCallback(
        async (action: string): Promise<string | null> => {
            if (!siteKey) return null
            try {
                await loadScript(siteKey)
                const grecaptcha = (window as unknown as { grecaptcha?: Grecaptcha }).grecaptcha
                if (!grecaptcha?.execute) return null
                return await new Promise<string | null>((resolve) => {
                    grecaptcha.ready(() => {
                        grecaptcha
                            .execute(siteKey, { action })
                            .then((token) => resolve(token))
                            .catch(() => resolve(null))
                    })
                })
            } catch {
                return null
            }
        },
        [siteKey],
    )

    return { execute, enabled: !!siteKey }
}
