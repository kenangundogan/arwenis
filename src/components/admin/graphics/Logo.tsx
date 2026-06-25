'use client'

import { useTheme } from '@payloadcms/ui'

export default function Logo() {
    const { theme } = useTheme()
    const src = theme === 'dark' ? '/assets/images/logo/logo-white.svg' : '/assets/images/logo/logo-black.svg'
    return (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="Arwenis" style={{ height: 80, width: 'auto', maxWidth: '100%' }} />
    )
}
