import { resolvers } from './searchBreadcrumb'
import { mockContext, resetContext } from '../../__mocks__/helpers'
import { getProduct } from '../../__mocks__/product'

describe('tests related to the name resolver', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    resetContext()
  })

  test('get name for category', async () => {
    const payload = {
      queryUnit: 'category',
      mapUnit: 'c',
      index: 0,
      queryArray: ['category'],
      mapArray: ['c'],
      categories: [],
      categoriesSearched: ['category'],
      products: {},
      metadataMap: {},
      hrefs: null,
    }
    const result = await resolvers.SearchBreadcrumb.name(payload as any, {}, mockContext as any)
    expect(result).toBe('category (((1))) <<<pt-BR>>>')
  })

  test('get name for category from metadata map', async () => {
    const payload = {
      queryUnit: 'category',
      mapUnit: 'c',
      index: 0,
      queryArray: ['category'],
      mapArray: ['c'],
      categories: [],
      categoriesSearched: ['category'],
      products: {},
      metadataMap: {
        ['category-c']: { name: 'category', id: 'id' }
      },
    }
    const result = await resolvers.SearchBreadcrumb.name(payload as any, {}, mockContext as any)
    expect(result).toBe('category (((id))) <<<pt-BR>>>')
  })

  test('get name for brand', async () => {
    const payload = {
      queryUnit: 'brand',
      mapUnit: 'b',
      index: 0,
      queryArray: ['brand'],
      mapArray: ['b'],
      categories: [],
      categoriesSearched: ['brand'],
      products: {},
      metadataMap: {},
    }
    const result = await resolvers.SearchBreadcrumb.name(payload as any, {}, mockContext as any)
    expect(result).toBe('brand (((1))) <<<pt-BR>>>')
  })

  test('get name for brand from metadata map', async () => {
    const payload = {
      queryUnit: 'brand',
      mapUnit: 'b',
      index: 0,
      queryArray: ['brand'],
      mapArray: ['b'],
      categories: [],
      categoriesSearched: ['brand'],
      products: {},
      metadataMap: {
        ['brand-b']: { name: 'brand', id: 'id' },
      },
    }
    const result = await resolvers.SearchBreadcrumb.name(payload as any, {}, mockContext as any)
    expect(result).toBe('brand (((id))) <<<pt-BR>>>')
  })

  test('get name for subcategory', async () => {
    const payload = {
      queryUnit: 'category2',
      mapUnit: 'c',
      index: 1,
      queryArray: ['category', 'category2'],
      mapArray: ['c', 'c'],
      categories: [],
      categoriesSearched: ['category', 'category2'],
      products: {},
      metadataMap: {},
    }
    const result = await resolvers.SearchBreadcrumb.name(payload as any, {}, mockContext as any)
    expect(result).toBe('category/category2 (((1))) <<<pt-BR>>>')
  })

  test('get name for subcategory from metadata map', async () => {
    const payload = {
      queryUnit: 'category2',
      mapUnit: 'c',
      index: 1,
      queryArray: ['category', 'category2'],
      mapArray: ['c', 'c'],
      categories: [],
      categoriesSearched: ['category', 'category2'],
      metadataMap: {
        ['category-c']: { name: 'category', id: 'id' },
        ['category2-c']: { name: 'category2', id: 'id2' },
      },
    }
    const result = await resolvers.SearchBreadcrumb.name(payload as any, {}, mockContext as any)
    expect(result).toBe('category2 (((id2))) <<<pt-BR>>>')
  })

  test('get name for subcategory in query with many facets', async () => {
    const payload = {
      queryUnit: 'category2',
      mapUnit: 'c',
      index: 1,
      queryArray: ['category', 'category2', 'brand', 'filter'],
      mapArray: ['c', 'c', 'b', 'specificationFilter_100'],
      categories: [],
      categoriesSearched: ['category', 'category2'],
      products: {},
      metadataMap: {},
    }
    const result = await resolvers.SearchBreadcrumb.name(payload as any, {}, mockContext as any)
    expect(result).toBe('category/category2 (((1))) <<<pt-BR>>>')
  })

  test('get name for subcategory in query with many facets in metadata map', async () => {
    const payload = {
      queryUnit: 'category2',
      mapUnit: 'c',
      index: 1,
      queryArray: ['category', 'category2', 'brand', 'filter'],
      mapArray: ['c', 'c', 'b', 'specificationFilter_100'],
      categories: [],
      categoriesSearched: ['category', 'category2'],
      products: {},
      metadataMap: {
        ['category-c']: { name: 'category', id: 'id' },
        ['category2-c']: { name: 'category2', id: 'id2' },
        ['brand-b']: { name: 'brand', id: 'id' }
      },
    }
    const result = await resolvers.SearchBreadcrumb.name(payload as any, {}, mockContext as any)
    expect(result).toBe('category2 (((id2))) <<<pt-BR>>>')
  })

  test('get name for filter', async () => {
    const payload = {
      queryUnit: 'filter',
      mapUnit: 'specificationFilter_100',
      index: 3,
      queryArray: ['category', 'category2', 'brand', 'filter'],
      mapArray: ['c', 'c', 'b', 'specificationFilter_100'],
      categories: [],
      categoriesSearched: ['category', 'category2'],
      products: {},
      metadataMap: {},
    }
    const result = await resolvers.SearchBreadcrumb.name(payload as any, {}, mockContext as any)
    expect(result).toBe('Filter')
  })

  test('get name for brand as filter', async () => {
    const payload = {
      queryUnit: 'brand',
      mapUnit: 'b',
      index: 2,
      queryArray: ['category', 'category2', 'brand', 'filter'],
      mapArray: ['c', 'c', 'b', 'specificationFilter_100'],
      categories: [],
      categoriesSearched: ['category', 'category2'],
      products: {},
      metadataMap: {},
    }
    const result = await resolvers.SearchBreadcrumb.name(payload as any, {}, mockContext as any)
    expect(result).toBe('brand (((1))) <<<pt-BR>>>')
  })

  test('get name for productClusterIds as filter', async () => {
    const product = getProduct({
      productClusters: {
        '140': 'Cool Cluster',
      }
    })

    const payload = {
      queryUnit: '140',
      mapUnit: 'productClusterIds',
      index: 0,
      queryArray: ['140', 'filter'],
      mapArray: ['productClusterIds', 'specificationFilter_100'],
      categories: [],
      categoriesSearched: [],
      products: [product],
      metadataMap: {},
    }
    const result = await resolvers.SearchBreadcrumb.name(payload as any, {}, mockContext as any)
    expect(result).toBe('Cool Cluster')
  })

  test('if productsClusterIds not found, fail gracefully', async () => {
    const product = getProduct({
      productClusters: {
        '141': 'Cool Cluster',
      }
    })

    const payload = {
      queryUnit: '140',
      mapUnit: 'productClusterIds',
      index: 0,
      queryArray: ['140', 'filter'],
      mapArray: ['productClusterIds', 'specificationFilter_100'],
      categories: [],
      categoriesSearched: [],
      products: [product],
      metadataMap: {},
    }
    const result = await resolvers.SearchBreadcrumb.name(payload as any, {}, mockContext as any)
    expect(result).toBe(payload.queryUnit)
  })

  test('get name for sellerIds as filter', async () => {
    const product = getProduct({
      productClusters: {
        '140': 'Cool Cluster',
      }
    })

    const payload = {
      queryUnit: '1',
      mapUnit: 'sellerIds',
      index: 0,
      queryArray: ['1', 'filter'],
      mapArray: ['sellerIds', 'specificationFilter_100'],
      categories: [],
      categoriesSearched: [],
      products: [product],
      metadataMap: {},
    }
    const result = await resolvers.SearchBreadcrumb.name(payload as any, {}, mockContext as any)
    expect(result).toBe('VTEX')
  })
})

describe('tests related to the href resolver', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    resetContext()
  })

  test('get href for department', () => {
    const payload = {
      queryUnit: 'category',
      mapUnit: 'c',
      index: 0,
      queryArray: ['category'],
      mapArray: ['c'],
      categories: [],
      categoriesSearched: ['category'],
      products: {},
      metadataMap: {},
    }
    const result = resolvers.SearchBreadcrumb.href(payload as any)
    expect(result).toBe('/category')
  })

  test('get href for category', () => {
    const payload = {
      queryUnit: 'category2',
      mapUnit: 'c',
      index: 1,
      queryArray: ['category', 'category2'],
      mapArray: ['c', 'c'],
      categories: [],
      categoriesSearched: ['category', 'category2'],
      products: {},
      metadataMap: {},
    }
    const result = resolvers.SearchBreadcrumb.href(payload as any)
    expect(result).toBe('/category/category2')
  })

  test('get href for brand', () => {
    const payload = {
      queryUnit: 'brand',
      mapUnit: 'b',
      index: 0,
      queryArray: ['brand'],
      mapArray: ['b'],
      categories: [],
      categoriesSearched: [],
      products: {},
      metadataMap: {},
    }
    const result = resolvers.SearchBreadcrumb.href(payload as any)
    expect(result).toBe('/brand')
  })

  test('get href for category with brand', () => {
    const payload = {
      queryUnit: 'brand',
      mapUnit: 'b',
      index: 1,
      queryArray: ['category', 'brand'],
      mapArray: ['c', 'b'],
      categories: [],
      categoriesSearched: ['category'],
      products: {},
      metadataMap: {},
    }
    const result = resolvers.SearchBreadcrumb.href(payload as any)
    expect(result).toBe('/category/brand?map=c,b')
  })

  test('get href for category and other filters', () => {
    const payload = {
      queryUnit: 'filter',
      mapUnit: 'specificationFilter_100',
      index: 3,
      queryArray: ['category', 'category2', 'brand', 'filter'],
      mapArray: ['c', 'c', 'b', 'specificationFilter_100'],
      categories: [],
      categoriesSearched: ['category', 'category2'],
      products: {},
      metadataMap: {},
    }
    const result = resolvers.SearchBreadcrumb.href(payload as any)
    expect(result).toBe('/category/category2/brand/filter?map=c,c,b,specificationFilter_100')
  })

  test('index arg will be respected always', () => {
    const payload = {
      queryUnit: 'brand',
      mapUnit: 'b',
      index: 2,
      queryArray: ['category', 'category2', 'brand', 'filter'],
      mapArray: ['c', 'c', 'b', 'specificationFilter_100'],
      categories: [],
      categoriesSearched: ['category', 'category2'],
      products: {},
      metadataMap: {},
    }
    const result = resolvers.SearchBreadcrumb.href(payload as any)
    expect(result).toBe('/category/category2/brand?map=c,c,b')
  })

  test('use hrefs args if available - department', () => {
    const payload = {
      queryUnit: 'category',
      mapUnit: 'c',
      index: 0,
      queryArray: ['category', 'category2', 'brand', 'filter'],
      mapArray: ['c', 'c', 'b', 'specificationFilter_100'],
      categories: [],
      categoriesSearched: ['category', 'category2'],
      products: {},
      metadataMap: {},
      hrefs: ['/category', '/category/category2', 'category/category2/brand', 'category/category2/brand/filter']
    }
    const result = resolvers.SearchBreadcrumb.href(payload as any)
    expect(result).toBe(payload.hrefs[0])
  })
  test('use hrefs args if available - category', () => {
    const payload = {
      queryUnit: 'category2',
      mapUnit: 'c',
      index: 1,
      queryArray: ['category', 'category2', 'brand', 'filter'],
      mapArray: ['c', 'c', 'b', 'specificationFilter_100'],
      categories: [],
      categoriesSearched: ['category', 'category2'],
      products: {},
      metadataMap: {},
      hrefs: ['/category', '/category/category2', 'category/category2/brand', 'category/category2/brand/filter']
    }
    const result = resolvers.SearchBreadcrumb.href(payload as any)
    expect(result).toBe(payload.hrefs[1])
  })

  test('use hrefs args if available - full href', () => {
    const payload = {
      queryUnit: 'filter',
      mapUnit: 'specificationFilter_100',
      index: 3,
      queryArray: ['category', 'category2', 'brand', 'filter'],
      mapArray: ['c', 'c', 'b', 'specificationFilter_100'],
      categories: [],
      categoriesSearched: ['category', 'category2'],
      products: {},
      metadataMap: {},
      hrefs: ['/category', '/category/category2', 'category/category2/brand', 'category/category2/brand/filter']
    }
    const result = resolvers.SearchBreadcrumb.href(payload as any)
    expect(result).toBe(payload.hrefs[3] + '?map=c,c,b,specificationFilter_100')
  })

  test('use hrefs args if available - brand', () => {
    const payload = {
      queryUnit: 'brand',
      mapUnit: 'b',
      index: 0,
      queryArray: ['brand', 'filter'],
      mapArray: ['b', 'specificationFilter_100'],
      categories: [],
      categoriesSearched: ['category', 'category2'],
      products: {},
      metadataMap: {},
      hrefs: ['brand', 'brand/filter']
    }
    const result = resolvers.SearchBreadcrumb.href(payload as any)
    expect(result).toBe(payload.hrefs[0])
  })
})
