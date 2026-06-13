import { APIError, PayloadRequest } from 'payload'

export const validateFileSize = (file: { size: number; mimetype: string }) => {
    const fileSize = file.size
    const mimeType = file.mimetype

    // SVG Dosyaları İçin Boyut Kontrolü (Max 5 MB)
    if (mimeType === 'image/svg+xml') {
        const MAX_SVG_SIZE_KB = 5120 // 5 MB
        if (fileSize > MAX_SVG_SIZE_KB * 1024) {
            throw new APIError(
                `Hata: SVG boyutu çok yüksek. Maksimum ${MAX_SVG_SIZE_KB / 1024} MB yükleyebilirsiniz. (Yüklenen: ${(fileSize / (1024 * 1024)).toFixed(2)} MB)`,
                400,
                undefined,
                true,
            )
        }
        return // SVG için diğer görsel kontrollerini atla
    }

    // Görseller İçin Boyut Kontrolü (Max 3 MB)
    if (mimeType && mimeType.startsWith('image/')) {
        const MAX_IMAGE_SIZE_KB = 3072 // 3 MB
        if (fileSize > MAX_IMAGE_SIZE_KB * 1024) {
            throw new APIError(
                `Hata: Görsel boyutu çok yüksek. Maksimum ${MAX_IMAGE_SIZE_KB / 1024} MB yükleyebilirsiniz. (Yüklenen: ${(fileSize / (1024 * 1024)).toFixed(2)} MB)`,
                400,
                undefined,
                true,
            )
        }
    }

    // Ses Dosyaları İçin Boyut Kontrolü (Max 100 MB)
    if (mimeType && mimeType.startsWith('audio/')) {
        const MAX_AUDIO_SIZE_KB = 102400 // 100 MB
        if (fileSize > MAX_AUDIO_SIZE_KB * 1024) {
            throw new APIError(
                `Hata: Ses dosyası boyutu çok yüksek. Maksimum ${MAX_AUDIO_SIZE_KB / 1024} MB yükleyebilirsiniz. (Yüklenen: ${(fileSize / (1024 * 1024)).toFixed(2)} MB)`,
                400,
                undefined,
                true,
            )
        }
    }

    // Video Dosyaları İçin Boyut Kontrolü (Max 100 MB)
    if (mimeType && mimeType.startsWith('video/')) {
        const MAX_VIDEO_SIZE_KB = 102400 // 100 MB
        if (fileSize > MAX_VIDEO_SIZE_KB * 1024) {
            throw new APIError(
                `Hata: Video dosyası boyutu çok yüksek. Maksimum ${MAX_VIDEO_SIZE_KB / 1024} MB yükleyebilirsiniz. (Yüklenen: ${(fileSize / (1024 * 1024)).toFixed(2)} MB)`,
                400,
                undefined,
                true,
            )
        }
    }
}

export const validateImageDimensions = (width?: number, height?: number, validationType?: string, mimeType?: string) => {
    // SVG ise boyut kontrolü yapma
    if (mimeType === 'image/svg+xml') return

    // Eğer genişlik ve yükseklik varsa (yani bu bir görselse)
    if (width && height) {
        if (validationType === '16x9') {
            if (width !== 1920 || height !== 1080) {
                throw new APIError(
                    'Hata: "16x9 (1920x1080)" tipi seçildi ancak yüklenen görsel bu boyutlarda değil.',
                    400,
                    undefined,
                    true,
                )
            }
        } else if (validationType === '9x16') {
            if (width !== 1080 || height !== 1920) {
                throw new APIError(
                    'Hata: "9x16 (1080x1920)" tipi seçildi ancak yüklenen görsel bu boyutlarda değil.',
                    400,
                    undefined,
                    true,
                )
            }
        }
        else if (validationType === '1x1') {
            if (width !== 1080 || height !== 1080) {
                throw new APIError(
                    'Hata: "1x1 (1080x1080)" tipi seçildi ancak yüklenen görsel bu boyutlarda değil.',
                    400,
                    undefined,
                    true,
                )
            }
        } else {
            // Tip seçilmediyse genel kuralları uygula (Sadece izin verilen boyutlar)
            const isLandscape = width === 1920 && height === 1080
            const isPortrait = width === 1080 && height === 1920
            const isSquare = width === 1080 && height === 1080

            if (!isLandscape && !isPortrait && !isSquare) {
                throw new APIError(
                    'Hata: Yüklenen görsel boyutları geçersiz. Sadece 1920x1080 (Yatay 16x9), 1080x1920 (Dikey 9x16) veya 1080x1080 (Kare 1x1) boyutlarında görseller kabul edilmektedir.',
                    400,
                    undefined,
                    true,
                )
            }
        }
    }
}

export const validateMediaDimensionsAsync = async (
    value: unknown,
    req: PayloadRequest,
    targetWidth: number,
    targetHeight: number,
): Promise<string | true> => {
    if (!value) return true

    let width: number | undefined
    let height: number | undefined

    // Eğer value bir obje ise ve width/height bilgisi varsa (Client-side veya populate edilmiş data)
    if (typeof value === 'object' && value !== null && 'width' in value && 'height' in value) {
        width = (value as { width: number }).width
        height = (value as { height: number }).height
    }
    // Eğer value bir ID ise veya obje ama boyut yoksa DB'den çek
    else {
        try {
            const id = typeof value === 'object' && value !== null && 'id' in value ? (value as { id: string | number }).id : value as string | number
            const file = await req.payload.findByID({
                collection: 'media',
                id,
                req,
            })
            width = file.width as number | undefined
            height = file.height as number | undefined
        } catch (_error) {
            return 'Görsel doğrulanırken bir hata oluştu.'
        }
    }

    if (width !== targetWidth || height !== targetHeight) {
        return `Hata: Seçilen görsel boyutları geçersiz. Sadece ${targetWidth}x${targetHeight} boyutunda görseller kabul edilmektedir.`
    }

    return true
}
