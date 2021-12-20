import type { VBase } from '@vtex/api'
import { clone, flatten } from 'ramda'

import type { Search } from '../clients/search'
import {
  LIST_SPECIFICATIONS_BY_CATEGORY_ID,
  SPECIFICATION_BUCKET,
} from '../resolvers/search/constants'
import type { Attribute, TextAttribute } from './attributes'
import { staleFromVBaseWhileRevalidate } from './vbase'

const getSpecificationsByCategoryId = (
  vbase: VBase,
  search: Search,
  categoryId: number
) => {
  return staleFromVBaseWhileRevalidate(
    vbase,
    `${LIST_SPECIFICATIONS_BY_CATEGORY_ID}`,
    categoryId.toString(),
    async (params: { categoryId: number; search: Search }) =>
      params.search.specificationsByCategoryId(params.categoryId),
    { categoryId, search },
    {
      expirationInMinutes: 10,
    }
  )
}

const isFilterByFieldId = async (
  vbase: VBase,
  search: Search,
  fieldId: number
) => {
  const specification = await staleFromVBaseWhileRevalidate(
    vbase,
    `${SPECIFICATION_BUCKET}`,
    fieldId.toString(),
    async (params: { fieldId: number; search: Search }) =>
      params.search.getField(params.fieldId),
    { fieldId, search },
    {
      expirationInMinutes: 10,
    }
  )

  return specification.IsFilter
}

const setFilterVisibility = async (
  vbase: VBase,
  search: Search,
  attributes: Attribute[]
) => {
  const hiddenSpecificationsMap = new Map<string, boolean>()
  const categoryRegex = /^category-[0-9]+$/

  const categoryValues = flatten(
    (attributes.filter(attribute =>
      categoryRegex.test(attribute.originalKey)
    ) as TextAttribute[]).map(attribute => attribute.values)
  )

  const activeCategoryIds: number[] = categoryValues
    .filter(value => value.active && value.id)
    .map(value => parseInt(value.id!))

  const categoryPromises = activeCategoryIds.map(categoryId => {
    return new Promise<void>(async categoryResolve => {
      const specifications = await getSpecificationsByCategoryId(
        vbase,
        search,
        categoryId
      )

      const specificationPromises = specifications.map(async specification => {
        if (hiddenSpecificationsMap.get(specification.Name)) {
          return
        }

        const isFilter = await isFilterByFieldId(
          vbase,
          search,
          specification.FieldId
        )

        hiddenSpecificationsMap.set(specification.Name, isFilter)
      })

      await Promise.all(specificationPromises)

      categoryResolve()
    })
  })

  await Promise.all(categoryPromises)

  const clonedFilters = clone(attributes)

  clonedFilters.forEach(attribute => {
    if (attribute.visible) {
      const isFilter = hiddenSpecificationsMap.get(attribute.originalLabel)

      if (typeof isFilter !== 'undefined') {
        attribute.visible = isFilter
      }
    }
  })

  return clonedFilters
}

export default setFilterVisibility
