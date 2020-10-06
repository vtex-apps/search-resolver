interface FilterListTreeCategoryById {
  Name: string
  CategoryId: number
  FieldId: number
  isActive: boolean
  IsStockKeepingUnit: boolean
}

interface FacetValuesArgs {
  from: number
  to: number
}

//This Type represents all kind of facets, from department, to categories, to brand and specifications
interface GenericFacet extends SearchFacet {
  NameWithTranslation?: string
  Id?: string
  Children?: GenericFacet
}

interface Facet {
  name: string,
  values: GenericFacet[]
}