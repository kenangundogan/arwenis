import { APIError, PayloadRequest } from 'payload'

export const validateFileSize = (file: { size: number; mimetype: string }) => {
    const fileSize = file.size
    const mimeType = file.mimetype

    if (mimeType === 'image/svg+xml') {
        const MAX_SVG_SIZE_KB = 5120
        if (fileSize > MAX_SVG_SIZE_KB * 1024) {
            throw new APIError(
                `Hata: SVG boyutu çok yüksek. Maksimum ${MAX_SVG_SIZE_KB / 1024} MB yükleyebilirsiniz. (Yüklenen: ${(fileSize / (1024 * 1024)).toFixed(2)} MB)`,
                400,
                undefined,
                true,
            )
        }
        return
    }

    if (mimeType && mimeType.startsWith('image/')) {
        const MAX_IMAGE_SIZE_KB = 3072
        if (fileSize > MAX_IMAGE_SIZE_KB * 1024) {
            throw new APIError(
                `Hata: Görsel boyutu çok yüksek. Maksimum ${MAX_IMAGE_SIZE_KB / 1024} MB yükleyebilirsiniz. (Yüklenen: ${(fileSize / (1024 * 1024)).toFixed(2)} MB)`,
                400,
                undefined,
                true,
            )
        }
    }

    if (mimeType && mimeType.startsWith('audio/')) {
        const MAX_AUDIO_SIZE_KB = 102400
        if (fileSize > MAX_AUDIO_SIZE_KB * 1024) {
            throw new APIError(
                `Hata: Ses dosyası boyutu çok yüksek. Maksimum ${MAX_AUDIO_SIZE_KB / 1024} MB yükleyebilirsiniz. (Yüklenen: ${(fileSize / (1024 * 1024)).toFixed(2)} MB)`,
                400,
                undefined,
                true,
            )
        }
    }

    if (mimeType && mimeType.startsWith('video/')) {
        const MAX_VIDEO_SIZE_KB = 102400
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

    if (mimeType === 'image/svg+xml') return

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

    if (typeof value === 'object' && value !== null && 'width' in value && 'height' in value) {
        width = (value as { width: number }).width
        height = (value as { height: number }).height
    }

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
