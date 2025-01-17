/* eslint-disable jest/no-mocks-import */

import { queries } from './index'
import { resolvers } from './productSearch'
import { mockContext, resetContext } from '../../__mocks__/helpers'
import { getProduct } from '../../__mocks__/product'

describe('tests related to the searchMetadata query', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    resetContext()
  })

  it('get search metadata from pageType for category', async () => {
    const args = { query: 'Department/Category', map: 'c,c' }

    const result = await queries.searchMetadata({}, args, mockContext as any)

    expect(result.titleTag).toBe('department/category-title')
    expect(result.metaTagDescription).toBe(
      'department/category-metaTagDescription (((1))) <<<pt-BR>>>'
    )
    expect(mockContext.clients.search.pageType).toBeCalledTimes(1)
  })

  it('get search metadata from pageType for brand', async () => {
    const args = { query: 'Brand', map: 'b' }

    const result = await queries.searchMetadata({}, args, mockContext as any)

    expect(result.titleTag).toBe('Brand-title')
    expect(result.metaTagDescription).toBe(
      'Brand-metaTagDescription (((1))) <<<pt-BR>>>'
    )
    expect(mockContext.clients.search.pageType).toBeCalledTimes(1)
  })

  it('get search metadata for ft search', async () => {
    const args = { query: 'Shoes', map: 'ft' }

    const result = await queries.searchMetadata({}, args, mockContext as any)

    expect(result.titleTag).toBe('Shoes')
    expect(result.metaTagDescription).toBeNull()
    expect(mockContext.clients.search.pageType).toBeCalledTimes(0)
  })

  it('get search metadata for specification filter search', async () => {
    const args = { query: 'Large', map: 'specificationFilter_10' }

    const result = await queries.searchMetadata({}, args, mockContext as any)

    expect(result.titleTag).toBe('Large')
    expect(result.metaTagDescription).toBeNull()
    expect(mockContext.clients.search.pageType).toBeCalledTimes(0)
  })

  it('get search metadata from pageType for category with brand', async () => {
    const args = { query: 'Department/Category/Brand', map: 'c,c,b' }

    const result = await queries.searchMetadata({}, args, mockContext as any)

    expect(result.titleTag).toBe('brand - department/category-title')
    expect(result.metaTagDescription).toBe(
      'department/category-metaTagDescription (((1))) <<<pt-BR>>>'
    )
    expect(mockContext.clients.search.pageType).toBeCalledTimes(2)
  })

  it('get search metadata from pageType for brand with category', async () => {
    const args = { query: 'Brand/Department/Category', map: 'b,c,c' }

    const result = await queries.searchMetadata({}, args, mockContext as any)

    expect(result.titleTag).toBe('department/category - Brand-title')
    expect(result.metaTagDescription).toBe(
      'Brand-metaTagDescription (((1))) <<<pt-BR>>>'
    )
    expect(mockContext.clients.search.pageType).toBeCalledTimes(2)
  })

  it('get search metadata from pageType for category with brand & specification filter', async () => {
    const args = {
      query: 'Department/Category/Brand/Large',
      map: 'c,c,b,specificationFilter_15',
    }

    const result = await queries.searchMetadata({}, args, mockContext as any)

    expect(result.titleTag).toBe('Large - brand - department/category-title')
    expect(result.metaTagDescription).toBe(
      'department/category-metaTagDescription (((1))) <<<pt-BR>>>'
    )
    expect(mockContext.clients.search.pageType).toBeCalledTimes(2)
  })

  it('get search metadata from pageType for category with brand in the middle', async () => {
    const args = {
      query: 'Department/Category/Brand/SubCategory',
      map: 'c,c,b,c',
    }

    const result = await queries.searchMetadata({}, args, mockContext as any)

    expect(result.titleTag).toBe(
      'brand - department/category/subcategory-title'
    )
    expect(result.metaTagDescription).toBe(
      'department/category/subcategory-metaTagDescription (((1))) <<<pt-BR>>>'
    )
    expect(mockContext.clients.search.pageType).toBeCalledTimes(2)
  })

  it('get search metadata for search ft with category', async () => {
    const args = {
      query: 'Shoes/Department/Category',
      map: 'ft,c,c',
    }

    const result = await queries.searchMetadata({}, args, mockContext as any)

    expect(result.titleTag).toBe('department/category - Shoes')
    expect(result.metaTagDescription).toBeNull()
    expect(mockContext.clients.search.pageType).toBeCalledTimes(1)
  })

  it('get search metadata for search ft with brand', async () => {
    const args = {
      query: 'Shoes/Brand',
      map: 'ft,b',
    }

    const result = await queries.searchMetadata({}, args, mockContext as any)

    expect(result.titleTag).toBe('brand - Shoes')
    expect(result.metaTagDescription).toBeNull()
    expect(mockContext.clients.search.pageType).toBeCalledTimes(1)
  })

  it('get search metadata for search ft with specification filter', async () => {
    const args = {
      query: 'Shoes/Large',
      map: 'ft,specificationFilter_10',
    }

    const result = await queries.searchMetadata({}, args, mockContext as any)

    expect(result.titleTag).toBe('Large - Shoes')
    expect(result.metaTagDescription).toBeNull()
    expect(mockContext.clients.search.pageType).toBeCalledTimes(0)
  })
  it('get search metadata from pageType for category with correct locale variables', async () => {
    const args = { query: 'Department/Category', map: 'c,c' }

    mockContext.vtex.locale = 'es-ES'
    mockContext.vtex.tenant.locale = 'fr-FR'

    const result = await queries.searchMetadata({}, args, mockContext as any)

    expect(result.titleTag).toBe('department/category-title-es-ES')
    expect(result.metaTagDescription).toBe(
      'department/category-metaTagDescription (((1))) <<<fr-FR>>>'
    )
    expect(mockContext.clients.search.pageType).toBeCalledTimes(1)
    expect(mockContext.state.messagesBindingLanguage.loadMany).toBeCalledTimes(
      1
    )
  })
})

describe('tests for breadcrumb resolver', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    resetContext()
  })
  it('create correct params for search with department', async () => {
    const products = [getProduct()]
    const args = {
      translatedArgs: {
        query: 'category',
        map: 'c',
      },
      productsRaw: { data: products },
    }

    const result = await resolvers.ProductSearch.breadcrumb(
      args as any,
      {},
      mockContext as any
    )

    expect(result).toHaveLength(1)
    const head = result[0]

    expect(head.queryUnit).toBe('category')
    expect(head.mapUnit).toBe('c')
    expect(head.categories).toHaveLength(0)
    expect(head.metadataMap).toMatchObject({})
    expect(head.categoriesSearched).toMatchObject(['category'])
    expect(head.hrefs).toBeNull()
    expect(head.index).toBe(0)
    expect(head.queryArray).toMatchObject(['category'])
    expect(head.mapArray).toMatchObject(['c'])
    expect(head.products).toBeDefined()
    expect(mockContext.clients.rewriter.getRoute).toBeCalledTimes(0)
  })
  it('create correct params for search with category', async () => {
    const products = [getProduct()]
    const args = {
      translatedArgs: {
        query: 'category/category2',
        map: 'c,c',
      },
      productsRaw: { data: products },
    }

    const result = await resolvers.ProductSearch.breadcrumb(
      args as any,
      {},
      mockContext as any
    )

    expect(result).toHaveLength(2)
    const head = result[0]
    const expectedQueryArray = ['category', 'category2']
    const expectedMapArray = ['c', 'c']

    expect(head.queryUnit).toBe('category')
    expect(head.mapUnit).toBe('c')
    expect(head.categories).toHaveLength(0)
    expect(head.metadataMap).toMatchObject({})
    expect(head.categoriesSearched).toMatchObject(['category', 'category2'])
    expect(head.hrefs).toBeNull()
    expect(head.index).toBe(0)
    expect(head.queryArray).toMatchObject(expectedQueryArray)
    expect(head.mapArray).toMatchObject(expectedMapArray)
    const tail = result[1]

    expect(tail.queryUnit).toBe('category2')
    expect(tail.mapUnit).toBe('c')
    expect(tail.categories).toHaveLength(0)
    expect(tail.metadataMap).toMatchObject({})
    expect(tail.categoriesSearched).toMatchObject(expectedQueryArray)
    expect(tail.hrefs).toBeNull()
    expect(tail.index).toBe(1)
    expect(tail.queryArray).toMatchObject(expectedQueryArray)
    expect(tail.mapArray).toMatchObject(expectedMapArray)
    expect(mockContext.clients.rewriter.getRoute).toBeCalledTimes(0)
  })

  it('create correct params for search with category binding translations', async () => {
    const products = [getProduct()]
    const args = {
      translatedArgs: {
        query: 'category/category2',
        map: 'c,c',
      },
      productsRaw: { data: products },
    }

    mockContext.vtex.binding.locale = 'es-ES'

    const result = await resolvers.ProductSearch.breadcrumb(
      args as any,
      {},
      mockContext as any
    )

    expect(result).toHaveLength(2)
    const head = result[0]
    const expectedQueryArray = ['category', 'category2']
    const expectedMapArray = ['c', 'c']

    expect(head.queryUnit).toBe('category')
    expect(head.mapUnit).toBe('c')
    expect(head.categories).toHaveLength(0)
    expect(head.categoriesSearched).toMatchObject(['category', 'category2'])
    expect(head.hrefs).toMatchObject([
      '/1-department-abc-es-ES',
      '/1-category-abc-es-ES',
    ])
    expect(head.index).toBe(0)
    expect(head.queryArray).toMatchObject(expectedQueryArray)
    expect(head.mapArray).toMatchObject(expectedMapArray)
    expect(head.metadataMap).toMatchObject({
      'category-c': { name: 'category', id: '1' },
      'category2-c': { name: 'category/category2', id: '1' },
    })
    const tail = result[1]

    expect(tail.queryUnit).toBe('category2')
    expect(tail.mapUnit).toBe('c')
    expect(tail.categories).toHaveLength(0)
    expect(tail.metadataMap).toMatchObject({
      'category-c': { name: 'category', id: '1' },
      'category2-c': { name: 'category/category2', id: '1' },
    })
    expect(tail.categoriesSearched).toMatchObject(expectedQueryArray)
    expect(tail.hrefs).toMatchObject([
      '/1-department-abc-es-ES',
      '/1-category-abc-es-ES',
    ])
    expect(tail.index).toBe(1)
    expect(tail.queryArray).toMatchObject(expectedQueryArray)
    expect(tail.mapArray).toMatchObject(expectedMapArray)
    expect(mockContext.clients.rewriter.getRoute).toBeCalledTimes(2)
  })
})

describe.skip('tests related to the productSearch query', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    resetContext()
  })

  it('should not translate args that are not ft', async () => {
    const args = {
      query: 'shoes/sneakers',
      map: 'c,c',
    }

    const result = await queries.productSearch(
      {},
      args as any,
      mockContext as any
    )

    expect(result.translatedArgs).toMatchObject({
      query: 'shoes/sneakers',
      map: 'c,c',
    })
  })

  it('should not translate ft args if user locale matches tenant locale', async () => {
    const args = {
      query: 'tenis/shoes/sneakers',
      map: 'ft,c,c',
    }

    const result = await queries.productSearch(
      {},
      args as any,
      mockContext as any
    )

    expect(result.translatedArgs).toMatchObject({
      query: 'tenis/shoes/sneakers',
      map: 'ft,c,c',
    })
  })

  it('should translate ft args if user locale differs tenant locale', async () => {
    mockContext.vtex.locale = 'es-ES'
    const args = {
      query: 'tenis/shoes/sneakers',
      map: 'ft,c,c',
    }

    const result = await queries.productSearch(
      {},
      args as any,
      mockContext as any
    )

    expect(result.translatedArgs).toMatchObject({
      query: 'tenis-pt-BR/shoes/sneakers',
      map: 'ft,c,c',
    })
  })
})
