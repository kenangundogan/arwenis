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
  'â': 'a',
  'Â': 'A',
  'î': 'i',
  'Î': 'I',
  'û': 'u',
  'Û': 'U',
}

export const generateSlug = (title: string, date?: string | Date): string => {
  let titleSlug = title

  Object.keys(turkishCharMap).forEach((key) => {
    titleSlug = titleSlug.replace(new RegExp(key, 'g'), turkishCharMap[key])
  })

  titleSlug = titleSlug
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .trim()

  if (date) {
    const dateObj = new Date(date)
    const formattedDate = dateObj.toISOString().split('T')[0]
    return `${titleSlug}-${formattedDate}`
  }

  return titleSlug
}
