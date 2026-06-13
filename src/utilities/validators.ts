import type { Validate } from 'payload'

import { hasText } from '@payloadcms/richtext-lexical/shared'

type Validator = (value: unknown, options?: unknown) => string | true | Promise<string | true>

/**
 * Birden fazla validasyon kuralını sırayla (pipe) çalıştırır.
 * İlk hata veren kuralda durur ve hatayı döndürür.
 * Hepsi geçerse true döner.
 */
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

/**
 * Sadece harfler (Türkçe dahil) ve boşluklara izin verir.
 */
export const onlyText = (message = 'Sadece harf ve boşluk içerebilir.'): Validator => {
    const regex = /^[a-zA-ZğüşıöçĞÜŞİÖÇ\s]+$/
    return matches(regex, message)
}

/**
 * Sadece harfler (Türkçe dahil), rakamlar ve boşluklara izin verir.
 */
export const alphaNumeric = (message = 'Sadece harf ve rakam içerebilir.'): Validator => {
    const regex = /^[a-zA-Z0-9ğüşıöçĞÜŞİÖÇ\s]+$/
    return matches(regex, message)
}

/**
 * E-posta formatı kontrolü
 */
export const email = (message = 'Geçerli bir e-posta adresi giriniz.'): Validator => {
    // Basit ama etkili bir e-posta regex'i
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return matches(regex, message)
}

/**
 * URL formatı kontrolü
 */
/**
 * URL formatı kontrolü (Daha katı ve "Profesyonel")
 * 1. Geçerli bir URL yapısı olmalı (new URL() ile parse edilebilir).
 * 2. HTTPS protokolü ZORUNLUDUR.
 * 3. Localhost hariç, geçerli bir domain yapısı (en az bir nokta) aranır.
 */
export const url = (message = 'Geçerli ve güvenli (HTTPS) bir URL giriniz.'): Validator => {
    return (value) => {
        if (!value) return true // Boş değer validasyonunu `required` kuralına bırakırız

        if (typeof value !== 'string') return message

        try {
            const parsedUrl = new URL(value)

            // 1. Protokol Kontrolü (HTTPS Zorunluluğu)
            if (parsedUrl.protocol !== 'https:') {
                return 'Güvenlik gereği URL "https://" ile başlamalıdır.'
            }

            // 2. Domain Yapısı Kontrolü
            // Localhost değilse, en az bir nokta (.) içermeli (örn. google.com)
            if (parsedUrl.hostname !== 'localhost' && !parsedUrl.hostname.includes('.')) {
                return 'Geçerli bir alan adı giriniz (örn: ornek.com).'
            }

            return true
        } catch (_) {
            // new URL() hata fırlatırsa URL geçersizdir
            return message
        }
    }
}

/**
 * URL relative path formatı kontrolü
 */
export const relativePath = (message = 'Geçerli bir URL relative path giriniz.'): Validator => {
    return (value) => {
        if (!value) return true; // Boş değer validasyonunu `required` kuralına bırakırız

        if (typeof value !== 'string') return message;

        // 1. Temel Başlangıç Kontrolü
        if (!value.startsWith('/')) {
            return 'URL "/" ile başlamalıdır.';
        }

        // 2. Anasayfa Kontrolü (Sadece "/" ise geçerli kabul et ve karakter testine sokma)
        if (value === '/') {
            return true;
        }

        // 3. Yan yana birden fazla slaş kontrolü (// engelleme)
        if (value.includes('//')) {
            return 'URL yan yana birden fazla "/" içeremez.';
        }

        // 4. Son Karakter Kontrolü (Anasayfa değilse sonu slaşla bitemez)
        if (value.endsWith('/')) {
            return 'URL sonuna "/" olamaz.';
        }

        // Daha okunaklı hata yönetimi için yasaklı karakter testi:
        const hasForbiddenChars = /[^a-zA-Z0-9\/\-\_]/.test(value);
        if (hasForbiddenChars) {
            return 'URL türkçe karakter, özel karakter ve boşluk içermemelidir.';
        }

        // 6. Teknik URL Doğrulaması (Base URL ekleyerek)
        try {
            new URL(value, process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000');
            return true;
        } catch (_) {
            return message;
        }
    }
}

/**
 * Sadece rakamlar
 */
export const numeric = (message = 'Sadece rakam içerebilir.'): Validator => {
    const regex = /^[0-9]+$/
    return matches(regex, message)
}

/**
 * Genel metin (Başlıklar ve Açıklamalar için).
 * Harf, Rakam, Boşluk ve Temel Noktalama İşaretlerine (.,:;!?'"()-_/) izin verir.
 */
export const generalText = (message = 'Geçersiz karakter içeriyor.'): Validator => {
    const regex = /^[a-zA-Z0-9ğüşıöçĞÜŞİÖÇ\s.,:;!?©'"()\-_\/]+$/
    return matches(regex, message)
}

/**
 * Slug formatı (sadece küçük harf, rakam ve tire)
 */
export const slugValidator = (message = 'Sadece küçük harf, rakam ve tire (-) içerebilir.'): Validator => {
    const regex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
    return matches(regex, message)
}

/**
 * Telefon numarası formatı (Basit kontrol: + ve rakamlar)
 */
export const phone = (message = 'Geçerli bir telefon numarası giriniz.'): Validator => {
    const regex = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/
    return matches(regex, message)
}

/**
 * Saat formatı kontrolü (HH:MM - 24 saat formatı)
 */
export const timeValidator = (message = 'Geçerli bir saat giriniz (HH:MM).'): Validator => {
    const regex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
    return matches(regex, message)
}

/**
 * Radyo Frekans formatı (örn: 94.8 FM veya sadece 94.8)
 */
export const frequencyValidator = (message = 'Geçerli bir frekans giriniz (örn: 94.8 veya 100.0).'): Validator => {
    const regex = /^\d{2,3}(\.\d)?( FM)?$/
    return matches(regex, message)
}

/**
 * Google Analytics ID formatı (G-XXXXXXXXXX veya UA-XXXXXXXXX-X)
 */
export const googleAnalyticsIdValidator = (message = 'Geçerli bir GA4 (G-) veya UA ID giriniz.'): Validator => {
    // Regex'i parantez içine alıp sonuna $ ekleyerek tüm satırı kontrol ediyoruz
    const regex = /^((G-[A-Z0-9]+)|(UA-\d+-\d+))$/
    return matches(regex, message)
}

/**
 * Google Tag Manager ID formatı (GTM-XXXXXXX)
 */
export const googleTagManagerIdValidator = (message = 'Geçerli bir GTM ID giriniz (GTM-XXXXXXX).'): Validator => {
    // Regex'i parantez içine alıp sonuna $ ekleyerek tüm satırı kontrol ediyoruz
    const regex = /^GTM-[A-Z0-9]+$/
    return matches(regex, message)
}

/**
 * Gemius Identifier formatı (ndo1xfstNHsPRToEOGsGen5.U5nI2PRsIZhficHgTKOXz0P.U9)
 */
export const gemiusIdentifierValidator = (message = 'Geçerli bir Gemius Identifier giriniz (ndo1xftNHPRToEOGsGen5.U5nIPRIZhficHgTKOXz0P.U7).'): Validator => {
    const regex = /^[a-zA-Z0-9]+\.[a-zA-Z0-9]+\.[a-zA-Z0-9]+$/
    return matches(regex, message)
}

/**
 * Gemius Hitcollector formatı (xgemius)
 */
export const gemiusHitcollectorValidator = (message = 'Geçerli bir Gemius Hitcollector giriniz (xgemius).'): Validator => {
    const regex = /^[a-zA-Z0-9]+$/
    return matches(regex, message)
}

/**
 * ISO 3166-1 alpha-2 Ülke Kodu (örn: TR, US, GB)
 */
export const isoCountryCodeValidator = (message = '2 harfli ülke kodu giriniz (örn: TR).'): Validator => {
    const regex = /^[A-Z]{2}$/
    return matches(regex, message)
}

/**
 * Script/HTML Kod Kontrolü
 * 1. eval() ve document.write() gibi riskli kullanımları engeller.
 * 2. En az bir HTML etiketi (<...>) içermesini bekler (Raw HTML render için).
 */
export const scriptValidator = (): Validator => {
    return (value) => {
        if (!value) return true // Alan boş bırakılabilir

        if (typeof value !== 'string') return 'Bu alan metin olmalıdır.'

        // 1. Güvenlik ve Performans Kontrolleri
        if (/\beval\s*\(/.test(value)) {
            return 'Güvenlik uyarısı: "eval()" kullanımı güvenlik riski oluşturabilir.'
        }
        if (/\bdocument\.write\s*\(/.test(value)) {
            return 'Performans uyarısı: "document.write()" kullanımı modern web standartlarına uygun değildir.'
        }

        // 2. Basit HTML Tag Kontrolü
        // İçinde en az bir açılış tag'i (<script, <link, <meta vb.) var mı?
        const hasTag = /<[a-z][\s\S]*>/i.test(value)
        if (!hasTag) {
            return 'Lütfen geçerli bir HTML veya Script etiketi giriniz (örn: <script>...</script>).'
        }

        return true
    }
}

/**
 * Saf JavaScript Kodu Kontrolü (Next.js <Script> bileşeni için)
 * 1. <script> veya herhangi bir HTML etiketi İÇERMEMELİDİR.
 * 2. React Fragment (<>) veya HTML yorum satırları (<!--) İÇERMEMELİDİR.
 * 3. Satır başları < ile başlamamalıdır (HTML yapısı şüphesi).
 */
export const pureJsValidator = (): Validator => {
    return (value) => {
        if (!value) return true

        if (typeof value !== 'string') return 'Bu alan metin olmalıdır.'

        // 1. Güvenlik
        if (/\beval\s*\(/.test(value)) {
            return 'Güvenlik uyarısı: "eval()" kullanımı güvenlik riski oluşturabilir.'
        }

        // 2. <script> Tag Kontrolü
        if (/<script[\s\S]*?>/i.test(value) || /<\/script>/i.test(value)) {
            return 'Bu alana <script> etiketi giremezsiniz. Sadece içeriğindeki JavaScript kodunu yapıştırın.'
        }

        // 3. Fragment (<>) ve Kapanış (</>) Kontrolü
        if (/^[\s]*<>/m.test(value) || /<\/>/.test(value)) {
            return 'React Fragment (<>) veya boş etiketler kullanamazsınız.'
        }

        // 4. HTML Yorum Satırı (<!-- -->) Kontrolü
        if (/<!--[\s\S]*?-->/.test(value)) {
            return 'HTML yorum satırları (<!-- -->) kullanamazsınız. Lütfen JS yorum satırları (// veya /* */) kullanın.'
        }

        // 5. Satır Başı HTML Tag Şüphesi
        // Eğer bir satır boşluklardan sonra < ve bir harf/ünlem/slash ile başlıyorsa muhtemelen HTML'dir.
        // JS'de bir satırın < ile başlaması (JSX hariç) çok nadirdir ve genelde syntax hatasıdır.
        if (/^\s*<[a-z!/]/im.test(value)) {
            return 'HTML etiketleri ile başlayamazsınız (Örn: <div>, <!DOCTYPE). Sadece JS kodu girin.'
        }

        return true
    }
}

/**
 * RichText blokları veya JSON nesneleri için boyut kontrolü.
 * Veriyi JSON string'e çevirir ve oluşan string'in uzunluğunu kontrol eder.
 * Bu, veritabanına kaydedilecek yaklaşık boyutu sınırlar.
 */
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


/**
 * Lexical RichText alanı için zorunluluk kontrolü.
 * Standart 'required' kontrolü RichText'in boş JSON yapısını (örn: boş paragraf) dolu sandığı için,
 * Payload'ın sağladığı 'hasText' metodunu kullanır.
 */
export const richTextRequired = (message = 'Bu alan zorunludur.'): Validator => {
    return (value) => {
        // Değer yoksa veya hasText false dönerse (içerik boşsa)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (!value || !hasText(value as any)) {
            return message
        }
        return true
    }
}


/**
 * CSS Boyut Kontrolü (px veya %)
 * Sadece sayı ve ardından 'px' veya '%' gelmelidir (örn: 100px, 50%).
 */
export const dimensionValidator = (message = 'Geçerli bir boyut giriniz (örn: 100px veya 50%).'): Validator => {
    // Sayı ile başlar, (opsiyonel ondalık), ardından px VEYA % ile biter.
    const regex = /^\d+(\.\d+)?(px|%)$/
    return matches(regex, message)
}

/**
 * Point (Koordinat) Kontrolü
 * Payload Point field [longitude, latitude] dizisi döndürür.
 */
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

        // Longitude: -180 to 180
        if (lng < -180 || lng > 180) {
            return 'Boylam (Longitude) değeri -180 ile 180 arasında olmalıdır.'
        }

        // Latitude: -90 to 90
        if (lat < -90 || lat > 90) {
            return 'Enlem (Latitude) değeri -90 ile 90 arasında olmalıdır.'
        }

        return true
    }
}

/**
 * Parola Güvenliği Kontrolü
 * - En az 8 karakter
 * - En fazla 16 karakter
 * - En az 1 büyük harf
 * - En az 1 küçük harf
 * - En az 1 rakam
 * - En az 1 özel karakter
 */
export const passwordValidator = (message?: string): Validator => {
    return (value) => {
        if (!value) return true // Boş değer kontrolü required'a bırakılır, ama password genelde required'dır.

        // Metin kontrolü
        if (typeof value !== 'string') return 'Parola metin olmalıdır.'

        // En az 8 karakter
        if (value.length < 8) {
            return message || 'Parola en az 8 karakter olmalıdır.'
        }

        // En fazla 16 karakter
        if (value.length > 16) {
            return message || 'Parola en fazla 16 karakter olmalıdır.'
        }

        // Büyük harf kontrolü
        if (!/[A-Z]/.test(value)) {
            return message || 'Parola en az 1 büyük harf içermelidir.'
        }

        // Küçük harf kontrolü
        if (!/[a-z]/.test(value)) {
            return message || 'Parola en az 1 küçük harf içermelidir.'
        }

        // Rakam kontrolü
        if (!/[0-9]/.test(value)) {
            return message || 'Parola en az 1 rakam içermelidir.'
        }

        // Özel karakter kontrolü
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(value)) {
            return message || 'Parola en az 1 özel karakter içermelidir.'
        }

        return true
    }
}

/**
 * Video Süresi Kontrolü (MM:SS veya M:SS formatı)
 * Örnekler: 5:30, 12:45, 0:45, 120:00
 */
export const durationValidator = (message = 'Geçerli bir süre giriniz (MM:SS formatında, örn: 5:30).'): Validator => {
    return (value) => {
        if (!value) return true // Boş değer kontrolü required'a bırakılır

        if (typeof value !== 'string') return message

        // MM:SS veya M:SS formatı kontrolü
        const regex = /^(\d{1,3}):([0-5][0-9])$/
        const match = value.match(regex)

        if (!match) {
            return message
        }

        const minutes = parseInt(match[1], 10)
        const seconds = parseInt(match[2], 10)

        // Dakika 0-999 arası olabilir (çok uzun videolar için)
        if (minutes < 0 || minutes > 999) {
            return 'Dakika 0-999 arasında olmalıdır.'
        }

        // Saniye 0-59 arası olmalı (regex zaten kontrol ediyor ama yine de)
        if (seconds < 0 || seconds > 59) {
            return 'Saniye 0-59 arasında olmalıdır.'
        }

        // Toplam süre en az 1 saniye olmalı
        if (minutes === 0 && seconds === 0) {
            return 'Video süresi en az 1 saniye olmalıdır.'
        }

        return true
    }
}




