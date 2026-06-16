export type DeviceType = 'desktop' | 'mobile' | 'tablet' | 'bot' | 'unknown'

export interface ParsedUserAgent {
    browser: string
    os: string
    deviceType: DeviceType
}

export const parseUserAgent = (raw: string | null | undefined): ParsedUserAgent => {
    const ua = (raw ?? '').toLowerCase()
    if (!ua) return { browser: 'unknown', os: 'unknown', deviceType: 'unknown' }

    const has = (token: string): boolean => ua.includes(token)

    if (has('bot') || has('crawler') || has('spider') || has('curl') || has('wget') || has('python-requests') || has('postman')) {
        return { browser: 'Bot', os: 'unknown', deviceType: 'bot' }
    }

    let os = 'unknown'
    if (has('windows nt')) os = 'Windows'
    else if (has('iphone') || has('ipad') || has('ipod')) os = 'iOS'
    else if (has('mac os x') || has('macintosh')) os = 'macOS'
    else if (has('android')) os = 'Android'
    else if (has('cros')) os = 'ChromeOS'
    else if (has('linux')) os = 'Linux'

    let browser = 'unknown'
    if (has('edg/') || has('edga/') || has('edgios/')) browser = 'Edge'
    else if (has('opr/') || has('opera')) browser = 'Opera'
    else if (has('samsungbrowser')) browser = 'Samsung Internet'
    else if (has('firefox') || has('fxios')) browser = 'Firefox'
    else if (has('chrome') || has('crios')) browser = 'Chrome'
    else if (has('safari')) browser = 'Safari'

    let deviceType: DeviceType = 'desktop'
    if (has('ipad') || (has('tablet') && !has('mobile')) || (has('android') && !has('mobile'))) {
        deviceType = 'tablet'
    } else if (has('mobi') || has('iphone') || has('ipod') || (has('android') && has('mobile'))) {
        deviceType = 'mobile'
    }

    return { browser, os, deviceType }
}
