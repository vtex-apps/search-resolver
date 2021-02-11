import { either, isEmpty, isNil } from 'ramda'
import unescape from 'unescape'
import { buildCategoryTreeBasedOnIntelligentSearch, convertSolrTree } from '../commons/compatibility-layer'

export type Attribute = (NumericalAttribute | TextAttribute) & {
  key: string
  originalKey: string
  label: string
  type: 'text' | 'number' | 'location'
  visible: boolean
  originalLabel: string
}

interface NumericalAttribute {
  type: 'number' | 'location'
  maxValue: number
  minValue: number
  active: boolean
  activeFrom?: string
  activeTo?: string
  values: {
    count: number
    from: string
    to: string
    active: boolean
  }[]
}

export interface TextAttribute {
  type: 'text'
  values: {
    id?: string
    key: string
    count: number
    active: boolean
    label: string
  }[]
}

type FilterType = 'PRICERANGE' | 'TEXT' | 'NUMBER' | 'CATEGORYTREE'
export interface Filter {
  type: FilterType
  name: string
  hidden: boolean
  values: FilterValue[],
}

export interface FilterValue {
  quantity: number
  name: string
  key: string
  value: string
  selected?: boolean
  range?: {
    from: number
    to: number
  },
  children?: FilterValue[]
}

interface CatalogAttributeValues {
  FieldValueId: number
  Value: string
  Position: number
}

interface AttributesToFilters {
  total: number
  attributes?: Attribute[]
  breadcrumb: Breadcrumb[]
  removeHiddenFacets: boolean
  solrFacets: SearchFacets,
  selectedFacets: SelectedFacet[]
  showCategoryTree: boolean

}

/**
 * Convert from Biggy's attributes into Specification Filters.
 *
 * @export
 * @param {Attribute[]} [attributes] Attributes from Biggy's API.
 * @returns {Filter[]}
 */
export const attributesToFilters = ({
  total,
  attributes,
  breadcrumb,
  removeHiddenFacets,
  solrFacets,
  selectedFacets,
  showCategoryTree
}: AttributesToFilters): Filter[] => {
  if (either(isNil, isEmpty)(attributes)) {
    return []
  }

  const categoryRegex = /category-[0-9]+/
  const response = attributes!
  .filter(attribute => !showCategoryTree || !categoryRegex.test(attribute.originalKey))
  .map(attribute => {
    const baseHref = (breadcrumb[breadcrumb.length - 1] ?? { href: '', name: '' }).href
    const { type, values } = convertValues(attribute, total, baseHref)

    return {
      values,
      type,
      name: attribute.label,
      hidden: !attribute.visible,
    }
  })

  // add solr categoryTree
  if (attributes && solrFacets && solrFacets.CategoriesTrees) {
    const intelligentSearchTree = attributes.filter(facet => categoryRegex.test(facet.originalKey))

    const [tree] = buildCategoryTreeBasedOnIntelligentSearch(solrFacets.CategoriesTrees, intelligentSearchTree)

    response.push({
      name: '',
      type:  'CATEGORYTREE',
      values: [convertSolrTree(tree, selectedFacets)!],
      hidden: false,
    })
  }

  if (removeHiddenFacets) {
    return response.filter(attribute => !attribute.hidden)
  }

  return response
}

/**
 * Convert values, and create FilterType, that can be either `PRICERANGE` or
 * `TEXT`, only price uses the `PRICERANGE` type, other number attributes that
 * come from Biggy's API are transformed into TEXT filters.
 *
 * Location attributes are also transformed in TEXT filters, but when a location
 * is selected, only a single bucket is returned (the API returns multiple buckets,
 * but does not return the selected one, and there's no need to select multiple
 * location buckets).
 *
 * If an attribute is not of type `'text' | 'number' | 'location'`, an error will
 * be thrown.
 *
 * @param {Attribute} attribute
 * @returns {{ type: FilterType; values: FilterValue[] }}
 */
const convertValues = (
  attribute: Attribute,
  total: number,
  baseHref: string
): { type: FilterType; values: FilterValue[] } => {
  // When creating a filter for price attribute, it should be the only one to use
  // the type `'PRICERANGE'`.
  const knownPriceKeys = ['price', 'pre-', 'precio', 'preco', 'pret', 'prezzo', 'prix']

  if (attribute.type === 'number' && (knownPriceKeys.some(p => p === attribute.key) || knownPriceKeys.some(p => p === attribute.originalKey))) {
    return {
      type: 'PRICERANGE',
      values: attribute.values.map((value: any) => {
        return {
          quantity: value.count,
          name: unescape(value.label),
          key: attribute.originalKey,
          value: value.key,
          selected: value.active,
          range: {
            from: parseFloat(
              isNaN(value.from) ? attribute.minValue : value.from
            ),
            to: parseFloat(isNaN(value.to) ? attribute.maxValue : value.to),
          },
        }
      }),
    }
  }

  // For other `number` and `location` attributes we use TEXT based filters (checkboxes),
  // with buckets (e.g.: 0 - 30, 30 - 90, etc).
  if (attribute.type === 'number' || attribute.type === 'location') {
    const valuePrefix = attribute.type === 'location' ? 'l:' : ''

    // When a bucket is active, we should only show it, and none of the othter options.
    if (attribute.active) {
      const from = !isNaN(parseFloat(attribute.activeFrom ?? '')) ? parseFloat(attribute.activeFrom!) : attribute.minValue
      const to = !isNaN(parseFloat(attribute.activeTo ?? '')) ? parseFloat(attribute.activeTo!) : attribute.maxValue

      return {
        type: 'TEXT',
        values: [
          {
            quantity: total,
            name: unescape(`${from} - ${to}`),
            value: `${valuePrefix}${from}:${to}`,
            key: attribute.originalKey,
            selected: attribute.active,
            range: {
              // Using absolute values so that slider remains the same.
              from: attribute.minValue,
              to: attribute.maxValue,
            },
          },
        ],
      }
    }

    return {
      type: 'TEXT',
      values: attribute.values.map(value => {
        const from = !isNaN(parseFloat(value.from)) ? parseFloat(value.from) : attribute.minValue
        const to = !isNaN(parseFloat(value.to)) ? parseFloat(value.to) : attribute.maxValue

        return {
          quantity: value.count,
          name: unescape(`${from} - ${to}`),
          key: attribute.originalKey,
          value: `${valuePrefix}${from}:${to}`,
          selected: value.active,
          range: {
            from,
            to
          },
        }
      }),
    }
  }

  // Basic `text` attributes.
  if (attribute.type === 'text') {
    return {
      type: 'TEXT',
      values: attribute.values.map(value => {
        return {
          id: value.id,
          quantity: value.count,
          name: unescape(value.label),
          key: attribute.originalKey,
          value: value.key,
          selected: value.active,
          href: buildHref(baseHref, attribute.key, value.key),
        }
      }),
    }
  }

  throw new Error(`Not recognized attribute type: ${attribute.type}`)
}

export const sortAttributeValuesByCatalog = (
  attribute: TextAttribute,
  values: CatalogAttributeValues[]
) => {
  const findPositionByLabel = (label: string) => {
    const catalogValue = values.find(value => value.Value === label)
    return catalogValue ? catalogValue.Position : -1
  }

  attribute.values.sort((a, b) => {
    const aPosition = findPositionByLabel(a.label)
    const bPosition = findPositionByLabel(b.label)

    return aPosition < bPosition ? -1 : 1
  })
}

export const buildHref = (
  baseHref: string,
  key: string,
  value: string
): string => {
  if (key === '' || value === '') {
    return baseHref
  }

  const [path = '', map = ''] = baseHref.split('?map=')
  const pathValues = [...path.split('/'), value].filter(x => x)
  const mapValues = [...map.split(','), key].filter(x => x)

  return `${pathValues.join('/')}?map=${mapValues.join(',')}`
}
