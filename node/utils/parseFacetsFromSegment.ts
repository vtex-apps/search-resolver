const parseFacetsFromSegment = (facetsString: string): SelectedFacet[] => {
  if (!facetsString) {
    return []
  }

  // "Remove ";" if it is the last character
  return facetsString.split(';').filter(facet => facet).map(facet => {
    const [key, value] = facet.split('=')

    return {
      key,
      value,
    }
  })
}

export default parseFacetsFromSegment
