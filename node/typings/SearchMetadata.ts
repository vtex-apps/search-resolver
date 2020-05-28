interface SearchMetadataArgs {
  query?: string | null
  map?: string | null
  selectedFacets?: SelectedFacets[]
}

interface SearchMetadata {
  titleTag?: string | null
  metaTagDescription?: string | null
  id?: string | null
}
