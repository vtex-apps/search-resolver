export const toTitleCase = (str: string) => {
  return str
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export const removeDiacriticsFromURL = (url: string) =>
  encodeURIComponent(
    decodeURIComponent(url)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
  )
