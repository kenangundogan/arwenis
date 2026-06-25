'use client'

import { useTheme } from '@payloadcms/ui'

export default function Icon() {
    const { theme } = useTheme()
    const src = theme === 'dark' ? '/assets/images/symbol/symbol-white.svg' : '/assets/images/symbol/symbol-black.svg'
    return (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="Arwenis" style={{ height: 26, width: 'auto' }} />
    )
}
