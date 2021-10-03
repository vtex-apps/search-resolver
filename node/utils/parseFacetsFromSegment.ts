const parseFacetsFromSegment = (facetsString: string): SelectedFacet[] => {
  if (!facetsString) {
    return []
  }

  // "Remove ";" if it is the last character
  const cleanFacetsString =
    facetsString[facetsString.length - 1] === ';'
      ? facetsString.substring(0, facetsString.length - 1)
      : facetsString

  return cleanFacetsString.split(';').map(facet => {
    const [key, value] = facet.split('=')
    return {
      key,
      value,
    }
  })
}

export default parseFacetsFromSegment
