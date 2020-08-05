import { queries } from './index'
import { mockContext } from '../../__mocks__/helpers'

describe('tests related to the searchMetadata query', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })
  test('get search metadata from pageType for category', async () => {
    const args = { query: 'Department/Category', map: 'c,c' }

    const result = await queries.searchMetadata({}, args, mockContext as any)
    expect(result.titleTag).toBe('department/category-title')
    expect(result.metaTagDescription).toBe(
      'department/category-metaTagDescription'
    )
    expect(mockContext.clients.search.pageType).toBeCalledTimes(1)
  })

  test('get search metadata from pageType for brand', async () => {
    const args = { query: 'Brand', map: 'b' }

    const result = await queries.searchMetadata({}, args, mockContext as any)
    expect(result.titleTag).toBe('Brand-title')
    expect(result.metaTagDescription).toBe('Brand-metaTagDescription')
    expect(mockContext.clients.search.pageType).toBeCalledTimes(1)
  })

  test('get search metadata for ft search', async () => {
    const args = { query: 'Shoes', map: 'ft' }

    const result = await queries.searchMetadata({}, args, mockContext as any)
    expect(result.titleTag).toBe('Shoes')
    expect(result.metaTagDescription).toBe(null)
    expect(mockContext.clients.search.pageType).toBeCalledTimes(0)
  })

  test('get search metadata for specification filter search', async () => {
    const args = { query: 'Large', map: 'specificationFilter_10' }

    const result = await queries.searchMetadata({}, args, mockContext as any)
    expect(result.titleTag).toBe('Large')
    expect(result.metaTagDescription).toBe(null)
    expect(mockContext.clients.search.pageType).toBeCalledTimes(0)
  })

  test('get search metadata from pageType for category with brand', async () => {
    const args = { query: 'Department/Category/Brand', map: 'c,c,b' }

    const result = await queries.searchMetadata({}, args, mockContext as any)
    expect(result.titleTag).toBe('brand - department/category-title')
    expect(result.metaTagDescription).toBe(
      'department/category-metaTagDescription'
    )
    expect(mockContext.clients.search.pageType).toBeCalledTimes(2)
  })

  test('get search metadata from pageType for brand with category', async () => {
    const args = { query: 'Brand/Department/Category', map: 'b,c,c' }

    const result = await queries.searchMetadata({}, args, mockContext as any)
    expect(result.titleTag).toBe('department/category - Brand-title')
    expect(result.metaTagDescription).toBe('Brand-metaTagDescription')
    expect(mockContext.clients.search.pageType).toBeCalledTimes(2)
  })

  test('get search metadata from pageType for category with brand & specification filter', async () => {
    const args = {
      query: 'Department/Category/Brand/Large',
      map: 'c,c,b,specificationFilter_15',
    }

    const result = await queries.searchMetadata({}, args, mockContext as any)
    expect(result.titleTag).toBe('Large - brand - department/category-title')
    expect(result.metaTagDescription).toBe(
      'department/category-metaTagDescription'
    )
    expect(mockContext.clients.search.pageType).toBeCalledTimes(2)
  })

  test('get search metadata from pageType for category with brand in the middle', async () => {
    const args = {
      query: 'Department/Category/Brand/SubCategory',
      map: 'c,c,b,c',
    }

    const result = await queries.searchMetadata({}, args, mockContext as any)
    expect(result.titleTag).toBe(
      'brand - department/category/subcategory-title'
    )
    expect(result.metaTagDescription).toBe(
      'department/category/subcategory-metaTagDescription'
    )
    expect(mockContext.clients.search.pageType).toBeCalledTimes(2)
  })

  test('get search metadata for search ft with category', async () => {
    const args = {
      query: 'Shoes/Department/Category',
      map: 'ft,c,c',
    }

    const result = await queries.searchMetadata({}, args, mockContext as any)
    expect(result.titleTag).toBe('department/category - Shoes')
    expect(result.metaTagDescription).toBe(null)
    expect(mockContext.clients.search.pageType).toBeCalledTimes(1)
  })

  test('get search metadata for search ft with brand', async () => {
    const args = {
      query: 'Shoes/Brand',
      map: 'ft,b',
    }

    const result = await queries.searchMetadata({}, args, mockContext as any)
    expect(result.titleTag).toBe('brand - Shoes')
    expect(result.metaTagDescription).toBe(null)
    expect(mockContext.clients.search.pageType).toBeCalledTimes(1)
  })

  test('get search metadata for search ft with specification filter', async () => {
    const args = {
      query: 'Shoes/Large',
      map: 'ft,specificationFilter_10',
    }

    const result = await queries.searchMetadata({}, args, mockContext as any)
    expect(result.titleTag).toBe('Large - Shoes')
    expect(result.metaTagDescription).toBe(null)
    expect(mockContext.clients.search.pageType).toBeCalledTimes(0)
  })
})
