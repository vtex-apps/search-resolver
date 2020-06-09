import { prop, toPairs } from 'ramda'

import { zipQueryAndMap } from './utils'
import { formatTranslatableProp, addContextToTranslatableString } from '../../utils/i18n'

interface EitherFacet extends SearchFacet {
  Children?: EitherFacet[]
}

//This Type represents all kind of facets, from department, to categories, to brand and specifications
interface GenericFacet extends SearchFacet {
  NameWithTranslation?: string
  Id?: string
  Children?: GenericFacet
}

enum FilterType {
  TEXT = 'TEXT',
  NUMBER = 'NUMBER',
  CATEGORYTREE = 'CATEGORYTREE',
  BRAND = 'BRAND',
  PRICERANGE = 'PRICERANGE',
}

const addSelected = (
  facets: EitherFacet[],
  { query, map }: { query: string; map: string }
): EitherFacet[] => {
  const joinedQueryAndMap = zipQueryAndMap(query, map)
  return facets.map(facet => {
    let children = facet.Children

    if (children) {
      children = addSelected(children, { query, map })
    }

    const currentFacetSlug = decodeURIComponent(facet.Value).toLowerCase()
    const isSelected =
      joinedQueryAndMap.find(
        ([slug, slugMap]) => slug === currentFacetSlug && facet.Map === slugMap
      ) !== undefined

    return {
      ...facet,
      Children: children,
      selected: isSelected,
    }
  })
}

const addId = (
  departments: SearchFacet[],
  categoryTree: SearchFacetCategory[]
) => {
  return departments.map(department => {
    const departmentInTree = categoryTree.find(
      category =>
        category.Name === department.Name && category.Link === department.Link
    )
    if (!departmentInTree) {
      return department
    }
    return {
      ...department,
      Id: departmentInTree.Id,
    }
  })
}

const baseFacetResolvers = {
  quantity: prop('Quantity'),
  name: prop('Name'),
  link: prop('Link'),
  linkEncoded: prop('LinkEncoded'),
  map: prop('Map'),
  value: prop('Value'),
}

const addNameWithTranslation = (specificationFacets: SearchFacet[], filterId: string | undefined, ctx: Context) => {
  if (!filterId) {
    return specificationFacets
  }

  return specificationFacets.map(facet => ({
    ...facet,
    NameWithTranslation: addContextToTranslatableString({ content: facet.Name, context: filterId }, ctx)
  }))
}

export const resolvers = {
  FacetValue: {
    quantity: prop('Quantity'),
    name: (facet: GenericFacet, _: unknown, ctx: Context) => {
      if (facet.NameWithTranslation) {
        console.log('teste NameWithTranslation: ', facet.NameWithTranslation)
        return facet.NameWithTranslation
      }
      if (facet.Id) {
        return formatTranslatableProp<GenericFacet, 'Name', 'Id'>('Name', 'Id')(facet, _, ctx)
      }
      return facet.Name
    },
    value: prop('Value'),
    id: prop('Id'),
    children: prop('Children'),
    key: prop('Map'),
    link: prop('Link'),
    linkEncoded: prop('LinkEncoded'),
    href: ({ Link }: { Link: string }) => {
      const [linkPath] = Link.split('?')
      return linkPath
    },
  },
  FilterFacet: {
    ...baseFacetResolvers,

    name: prop('Name'),
  },
  DepartmentFacet: {
    ...baseFacetResolvers,

    id: prop('Id'),

    name: (facet: GenericFacet, _: unknown, ctx: Context) => {
      if (facet.Id) {
        return formatTranslatableProp<GenericFacet, 'Name', 'Id'>('Name', 'Id')(facet, _, ctx)
      }
      return facet.Name
    },
  },
  BrandFacet: {
    ...baseFacetResolvers,

    id: prop('Id'),
    //TODO: add translation to name here when brand has ID
  },
  PriceRangesFacet: {
    ...baseFacetResolvers,

    slug: prop('Slug'),
  },
  CategoriesTreeFacet: {
    ...baseFacetResolvers,

    id: prop('Id'),

    children: prop('Children'),

    href: ({ Link }: { Link: string }) => {
      const [linkPath] = Link.split('?')
      return linkPath
    },

    name: formatTranslatableProp<SearchFacetCategory, 'Name', 'Id'>('Name', 'Id')
  },
  Facets: {
    facets: async ({
      CategoriesTrees = [],
      Brands = [],
      SpecificationFilters = {},
      PriceRanges = [],
      queryArgs,
    }: SearchFacets & { queryArgs: { query: string; map: string } }, _: unknown, ctx: Context) => {
      const brands = {
        values: addSelected(Brands, queryArgs),
        type: FilterType.BRAND,
      }

      const catregoriesTrees = {
        values: addSelected(CategoriesTrees, queryArgs),
        type: FilterType.CATEGORYTREE,
      }

      const specificationFilters = toPairs(SpecificationFilters).map(
        ([filterName, filterFacets]) => {
          const filterId = filterFacets?.[0].Map.split('_')?.[1]
          const name = filterId ? addContextToTranslatableString({ content: filterName, context: filterId }, ctx) : filterName
          return {
            name,
            values: addNameWithTranslation(addSelected(filterFacets, queryArgs), filterId, ctx),
            type: FilterType.TEXT,
          }
        }
      )

      const priceRanges = {
        values: PriceRanges.map(priceRange => {
          const priceRangeRegex = /^de-(.*)-a-(.*)$/
          const groups = priceRange.Slug.match(priceRangeRegex)
          return {
            ...priceRange,
            range: { from: parseFloat(groups![1]), to: parseFloat(groups![2]) },
          }
        }),
        type: FilterType.PRICERANGE,
      }

      return [brands, catregoriesTrees, ...specificationFilters, priceRanges]
    },
    queryArgs: ({
      queryArgs,
    }: SearchFacets & { queryArgs: { query: string; map: string } }) => {
      const { query, map } = queryArgs

      const queryValues = query.split('/')
      const mapValues = map.split(',')

      const selectedFacets =
        queryValues.length === mapValues.length
          ? mapValues.map((map, i) => {
            return {
              key: map,
              value: queryValues[i],
            }
          })
          : []

      return {
        ...queryArgs,
        selectedFacets
      }
    },
    departments: ({
      Departments = [],
      CategoriesTrees = [],
      queryArgs,
    }: SearchFacets & { queryArgs: { query: string; map: string } }) => {
      const withSelected = addSelected(Departments, queryArgs)
      const withCategoryId = addId(withSelected, CategoriesTrees)
      return withCategoryId
    },

    brands: ({
      Brands = [],
      queryArgs,
    }: SearchFacets & { queryArgs: { query: string; map: string } }) => {
      return addSelected(Brands, queryArgs)
    },

    specificationFilters: ({
      SpecificationFilters = {},
      queryArgs,
    }: SearchFacets & { queryArgs: { query: string; map: string } }) => {
      return toPairs(SpecificationFilters).map(([filterName, filterFacets]) => {
        return {
          name: filterName,
          facets: addSelected(filterFacets, queryArgs),
        }
      })
    },

    categoriesTrees: ({
      CategoriesTrees = [],
      queryArgs,
    }: SearchFacets & { queryArgs: { query: string; map: string } }) => {
      return addSelected(CategoriesTrees, queryArgs)
    },

    priceRanges: prop('PriceRanges'),

    recordsFiltered: async (root: any, _: any, ctx: Context) => {
      const {
        clients: { search },
      } = ctx

      try {
        return search.productsQuantity(root.queryArgs)
      } catch (e) {
        return 0
      }
    },
  },
}
