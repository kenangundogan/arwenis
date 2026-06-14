import type { Validate } from 'payload'

import { hasText } from '@payloadcms/richtext-lexical/shared'

type Validator = (value: unknown, options?: unknown) => string | true | Promise<string | true>

export const composeValidators = (...validators: Validator[]): Validate => {
    return async (value, options) => {
        for (const validator of validators) {
            const result = await validator(value, options)
            if (result !== true) {
                return result
            }
        }
        return true
    }
}

export const required = (message = 'Bu alan zorunludur.'): Validator => {
    return (value) => {
        if (value === undefined || value === null || value === '') {
            return message
        }
        return true
    }
}

export const minLength = (min: number, message?: string): Validator => {
    return (value) => {
        if (value && typeof value === 'string' && value.length < min) {
            return message || `En az ${min} karakter girmelisiniz.`
        }
        return true
    }
}

export const maxLength = (max: number, message?: string): Validator => {
    return (value) => {
        if (value && typeof value === 'string' && value.length > max) {
            return message || `En fazla ${max} karakter girebilirsiniz.`
        }
        return true
    }
}

export const matches = (regex: RegExp, message: string): Validator => {
    return (value) => {
        if (typeof value === 'string' && !regex.test(value)) {
            return message
        }
        return true
    }
}

export const onlyText = (message = 'Sadece harf ve boşluk içerebilir.'): Validator => {
    const regex = /^[a-zA-ZğüşıöçĞÜŞİÖÇâîûÂÎÛ\s]+$/
    return matches(regex, message)
}

export const alphaNumeric = (message = 'Sadece harf ve rakam içerebilir.'): Validator => {
    const regex = /^[a-zA-Z0-9ğüşıöçĞÜŞİÖÇ\s]+$/
    return matches(regex, message)
}

export const email = (message = 'Geçerli bir e-posta adresi giriniz.'): Validator => {

    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return matches(regex, message)
}

export const url = (message = 'Geçerli ve güvenli (HTTPS) bir URL giriniz.'): Validator => {
    return (value) => {
        if (!value) return true

        if (typeof value !== 'string') return message

        try {
            const parsedUrl = new URL(value)

            if (parsedUrl.protocol !== 'https:') {
                return 'Güvenlik gereği URL "https://" ile başlamalıdır.'
            }

            if (parsedUrl.hostname !== 'localhost' && !parsedUrl.hostname.includes('.')) {
                return 'Geçerli bir alan adı giriniz (örn: ornek.com).'
            }

            return true
        } catch (_) {

            return message
        }
    }
}

export const relativePath = (message = 'Geçerli bir URL relative path giriniz.'): Validator => {
    return (value) => {
        if (!value) return true;

        if (typeof value !== 'string') return message;

        if (!value.startsWith('/')) {
            return 'URL "/" ile başlamalıdır.';
        }

        if (value === '/') {
            return true;
        }

        if (value.includes('//')) {
            return 'URL yan yana birden fazla "/" içeremez.';
        }

        if (value.endsWith('/')) {
            return 'URL sonuna "/" olamaz.';
        }

        const hasForbiddenChars = /[^a-zA-Z0-9\/\-\_]/.test(value);
        if (hasForbiddenChars) {
            return 'URL türkçe karakter, özel karakter ve boşluk içermemelidir.';
        }

        try {
            new URL(value, process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000');
            return true;
        } catch (_) {
            return message;
        }
    }
}

export const numeric = (message = 'Sadece rakam içerebilir.'): Validator => {
    const regex = /^[0-9]+$/
    return matches(regex, message)
}

export const generalText = (message = 'Geçersiz karakter içeriyor.'): Validator => {
    const regex = /^[a-zA-Z0-9ğüşıöçĞÜŞİÖÇâîûÂÎÛ\s.,:;!?©'"()\-_\/]+$/
    return matches(regex, message)
}

export const slugValidator = (message = 'Sadece küçük harf, rakam ve tire (-) içerebilir.'): Validator => {
    const regex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
    return matches(regex, message)
}

export const phone = (message = 'Geçerli bir telefon numarası giriniz.'): Validator => {
    const regex = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/
    return matches(regex, message)
}

export const timeValidator = (message = 'Geçerli bir saat giriniz (HH:MM).'): Validator => {
    const regex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
    return matches(regex, message)
}

export const frequencyValidator = (message = 'Geçerli bir frekans giriniz (örn: 94.8 veya 100.0).'): Validator => {
    const regex = /^\d{2,3}(\.\d)?( FM)?$/
    return matches(regex, message)
}

export const googleAnalyticsIdValidator = (message = 'Geçerli bir GA4 (G-) veya UA ID giriniz.'): Validator => {

    const regex = /^((G-[A-Z0-9]+)|(UA-\d+-\d+))$/
    return matches(regex, message)
}

export const googleTagManagerIdValidator = (message = 'Geçerli bir GTM ID giriniz (GTM-XXXXXXX).'): Validator => {

    const regex = /^GTM-[A-Z0-9]+$/
    return matches(regex, message)
}

export const gemiusIdentifierValidator = (message = 'Geçerli bir Gemius Identifier giriniz (ndo1xftNHPRToEOGsGen5.U5nIPRIZhficHgTKOXz0P.U7).'): Validator => {
    const regex = /^[a-zA-Z0-9]+\.[a-zA-Z0-9]+\.[a-zA-Z0-9]+$/
    return matches(regex, message)
}

export const gemiusHitcollectorValidator = (message = 'Geçerli bir Gemius Hitcollector giriniz (xgemius).'): Validator => {
    const regex = /^[a-zA-Z0-9]+$/
    return matches(regex, message)
}

export const isoCountryCodeValidator = (message = '2 harfli ülke kodu giriniz (örn: TR).'): Validator => {
    const regex = /^[A-Z]{2}$/
    return matches(regex, message)
}

export const scriptValidator = (): Validator => {
    return (value) => {
        if (!value) return true

        if (typeof value !== 'string') return 'Bu alan metin olmalıdır.'

        if (/\beval\s*\(/.test(value)) {
            return 'Güvenlik uyarısı: "eval()" kullanımı güvenlik riski oluşturabilir.'
        }
        if (/\bdocument\.write\s*\(/.test(value)) {
            return 'Performans uyarısı: "document.write()" kullanımı modern web standartlarına uygun değildir.'
        }

        const hasTag = /<[a-z][\s\S]*>/i.test(value)
        if (!hasTag) {
            return 'Lütfen geçerli bir HTML veya Script etiketi giriniz (örn: <script>...</script>).'
        }

        return true
    }
}

export const pureJsValidator = (): Validator => {
    return (value) => {
        if (!value) return true

        if (typeof value !== 'string') return 'Bu alan metin olmalıdır.'

        if (/\beval\s*\(/.test(value)) {
            return 'Güvenlik uyarısı: "eval()" kullanımı güvenlik riski oluşturabilir.'
        }

        if (/<script[\s\S]*?>/i.test(value) || /<\/script>/i.test(value)) {
            return 'Bu alana <script> etiketi giremezsiniz. Sadece içeriğindeki JavaScript kodunu yapıştırın.'
        }

        if (/^[\s]*<>/m.test(value) || /<\/>/.test(value)) {
            return 'React Fragment (<>) veya boş etiketler kullanamazsınız.'
        }

        if (/<!--[\s\S]*?-->/.test(value)) {
            return 'HTML yorum satırları (<!-- -->) kullanamazsınız. Lütfen JS yorum satırları (// veya /* */) kullanın.'
        }

        if (/^\s*<[a-z!/]/im.test(value)) {
            return 'HTML etiketleri ile başlayamazsınız (Örn: <div>, <!DOCTYPE). Sadece JS kodu girin.'
        }

        return true
    }
}

export const jsonSizeValidator = (maxsize: number, message?: string): Validator => {
    return (value) => {
        if (!value) return true

        const stringified = JSON.stringify(value)
        if (stringified.length > maxsize) {
            return message || `İçerik çok büyük. İzin verilen maksimum boyut aşıldı.`
        }

        return true
    }
}

export const richTextRequired = (message = 'Bu alan zorunludur.'): Validator => {
    return (value) => {

        if (!value || !hasText(value as any)) {
            return message
        }
        return true
    }
}

export const dimensionValidator = (message = 'Geçerli bir boyut giriniz (örn: 100px veya 50%).'): Validator => {

    const regex = /^\d+(\.\d+)?(px|%)$/
    return matches(regex, message)
}

export const pointValidator = (message = 'Geçerli bir konum seçiniz.'): Validator => {
    return (value) => {
        if (!value) return true

        if (!Array.isArray(value) || value.length !== 2) {
            return message
        }

        const [lng, lat] = value

        if (typeof lng !== 'number' || typeof lat !== 'number') {
            return message
        }

        if (lng < -180 || lng > 180) {
            return 'Boylam (Longitude) değeri -180 ile 180 arasında olmalıdır.'
        }

        if (lat < -90 || lat > 90) {
            return 'Enlem (Latitude) değeri -90 ile 90 arasında olmalıdır.'
        }

        return true
    }
}

export const passwordValidator = (message?: string): Validator => {
    return (value) => {
        if (!value) return true

        if (typeof value !== 'string') return 'Parola metin olmalıdır.'

        if (value.length < 8) {
            return message || 'Parola en az 8 karakter olmalıdır.'
        }

        if (value.length > 16) {
            return message || 'Parola en fazla 16 karakter olmalıdır.'
        }

        if (!/[A-Z]/.test(value)) {
            return message || 'Parola en az 1 büyük harf içermelidir.'
        }

        if (!/[a-z]/.test(value)) {
            return message || 'Parola en az 1 küçük harf içermelidir.'
        }

        if (!/[0-9]/.test(value)) {
            return message || 'Parola en az 1 rakam içermelidir.'
        }

        if (!/[!@#$%^&*(),.?":{}|<>]/.test(value)) {
            return message || 'Parola en az 1 özel karakter içermelidir.'
        }

        return true
    }
}

export const durationValidator = (message = 'Geçerli bir süre giriniz (MM:SS formatında, örn: 5:30).'): Validator => {
    return (value) => {
        if (!value) return true

        if (typeof value !== 'string') return message

        const regex = /^(\d{1,3}):([0-5][0-9])$/
        const match = value.match(regex)

        if (!match) {
            return message
        }

        const minutes = parseInt(match[1], 10)
        const seconds = parseInt(match[2], 10)

        if (minutes < 0 || minutes > 999) {
            return 'Dakika 0-999 arasında olmalıdır.'
        }

        if (seconds < 0 || seconds > 59) {
            return 'Saniye 0-59 arasında olmalıdır.'
        }

        if (minutes === 0 && seconds === 0) {
            return 'Video süresi en az 1 saniye olmalıdır.'
        }

        return true
    }
}

