import { prop, toPairs, last } from 'ramda'

import { zipQueryAndMap } from './utils'
import { formatTranslatableProp, shouldTranslateForBinding } from '../../utils/i18n'

interface EitherFacet extends SearchFacet {
  Children?: EitherFacet[]
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

const translateValues = (facets: SearchFacetCategory[], ctx: Context) => {
  const { clients: { rewriter }, vtex: { binding } } = ctx
  return Promise.all(facets.map(async facet => {
    // return facet
    let link = facet.Link
    let value = facet.Value
    if (shouldTranslateForBinding(ctx)) {
      const newRoute = await rewriter.getRoute(facet.Id.toString(), 'anyCategoryEntity', binding!.id!)
      link = newRoute ?? link
      value = newRoute ? last(newRoute.split('/')) : facet.Value
    }
    
    return {
      ...facet,
      Name: formatTranslatableProp<SearchFacetCategory, 'Name', 'Id'>('Name', 'Id')(facet, {}, ctx),
      Link: link,
      Value: value,
      LinkEncoded: encodeURI(link),
    }
  }))
}

const baseFacetResolvers = {
  quantity: prop('Quantity'),
  name: prop('Name'),
  link: prop('Link'),
  linkEncoded: prop('LinkEncoded'),
  map: prop('Map'),
  value: prop('Value'),
}

export const resolvers = {
  FacetValue: {
    quantity: prop('Quantity'),
    name: prop('Name'),
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

    name: (facet: any, _: unknown, ctx: Context) => {
      if (facet.Id) {
        return formatTranslatableProp<any, any, any>('Name', 'Id')(facet, _, ctx)
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
      // TODO: add translation to name 
      const brands = {
        values: addSelected(Brands, queryArgs),
        type: FilterType.BRAND,
      }

      const catregoriesTrees = {
        values: translateValues(addSelected(CategoriesTrees, queryArgs) as SearchFacetCategory[], ctx),
        // values: addSelected(CategoriesTrees, queryArgs),
        type: FilterType.CATEGORYTREE,
      }

      const specificationFilters = toPairs(SpecificationFilters).map(
        ([filterName, filterFacets]) => {
          return {
            name: filterName,
            values: addSelected(filterFacets, queryArgs),
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
