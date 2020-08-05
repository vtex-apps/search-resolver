interface SearchMetadataArgs {
  query?: string | null
  map?: string | null
  selectedFacets?: SelectedFacet[]
}

interface SearchMetadata {
  titleTag?: string | null
  metaTagDescription?: string | null
}
