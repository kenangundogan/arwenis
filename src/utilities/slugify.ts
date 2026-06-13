/**
 * Türkçe karakter haritası - Türkçe karakterleri İngilizce karşılıklarına çevirir
 */
export const turkishCharMap: Record<string, string> = {
  'ç': 'c',
  'Ç': 'C',
  'ğ': 'g',
  'Ğ': 'G',
  'ı': 'i',
  'İ': 'I',
  'ö': 'o',
  'Ö': 'O',
  'ş': 's',
  'Ş': 'S',
  'ü': 'u',
  'Ü': 'U',
}

/**
 * Türkçe karakterleri İngilizce'ye çevirerek URL-friendly slug oluşturur
 * @param title - Slug'a çevrilecek başlık
 * @param date - Slug'a eklenecek tarih (opsiyonel)
 * @returns URL-friendly slug
 */
export const generateSlug = (title: string, date?: string | Date): string => {
  let titleSlug = title

  // Türkçe karakterleri değiştir
  Object.keys(turkishCharMap).forEach((key) => {
    titleSlug = titleSlug.replace(new RegExp(key, 'g'), turkishCharMap[key])
  })

  // Slug formatına çevir
  titleSlug = titleSlug
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Alfanumerik olmayan karakterleri kaldır
    .replace(/\s+/g, '-') // Boşlukları tire ile değiştir
    .replace(/[\s_]+/g, '-')  // boşluk ve alt tireleri tek seferde tireye çevir
    .replace(/-+/g, '-')      // ardışık tireleri teke indir
    .replace(/^-+|-+$/g, '') // Başındaki ve sonundaki tireleri kaldır
    .trim()

  // Eğer tarih varsa slug'a ekle
  if (date) {
    const dateObj = new Date(date)
    const formattedDate = dateObj.toISOString().split('T')[0]
    return `${titleSlug}-${formattedDate}`
  }

  return titleSlug
}
