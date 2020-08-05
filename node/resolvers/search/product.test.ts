import { resolvers } from './product'
import { mockContext } from '../../__mocks__/helpers'
import { getProduct } from '../../__mocks__/product'

describe('tests related to product resolver', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockContext.vtex.platform = 'vtex'
  })
  describe('categoryTree resolver', () => {
    test('ensure that VTEX account never calls the category tree search API', async () => {
      const searchProduct = getProduct()
      await resolvers.Product.categoryTree(
        searchProduct as any,
        {},
        mockContext as any
      )
      expect(mockContext.clients.search.category).toBeCalledTimes(2)
      expect(mockContext.clients.search.categories).toBeCalledTimes(0)
    })

    test('get correct main category tree for product with only one tree', async () => {
      const searchProduct = getProduct()
      await resolvers.Product.categoryTree(
        searchProduct as any,
        {},
        mockContext as any
      )
      expect(mockContext.clients.search.category).toBeCalledTimes(2)
      expect(mockContext.clients.search.category.mock.calls[0][0]).toBe(25)
      expect(mockContext.clients.search.category.mock.calls[1][0]).toBe(10)
    })

    test('get correct main category tree for product with more than one tree', async () => {
      const categoriesIds = [
        '/101/101003/101003009/',
        '/101/101003/',
        '/101/',
        '/101/101019/101019004/',
        '/101/101019/',
        '/103/103023/103023003/',
        '/103/103023/',
        '/103/',
      ]
      const searchProduct = getProduct({
        categoriesIds,
        categoryId: '101003009',
      })

      await resolvers.Product.categoryTree(
        searchProduct as any,
        {},
        mockContext as any
      )
      expect(mockContext.clients.search.category).toBeCalledTimes(3)
      expect(mockContext.clients.search.category.mock.calls[0][0]).toBe(101)
      expect(mockContext.clients.search.category.mock.calls[1][0]).toBe(101003)
      expect(mockContext.clients.search.category.mock.calls[2][0]).toBe(
        101003009
      )
    })

    test('ensure that GC account calls the category tree API ', async () => {
      const searchProduct = getProduct()
      mockContext.vtex.platform = 'gocommerce'
      mockContext.clients.search.categories.mockImplementation(() => [
        {
          id: '10',
          name: 'a',
          url: 'a',
          children: [],
        },
        {
          id: '25',
          name: 'a',
          url: 'a',
          children: [],
        },
      ])
      const result = await resolvers.Product.categoryTree(
        searchProduct as any,
        {},
        mockContext as any
      )
      expect(mockContext.clients.search.category).toBeCalledTimes(0)
      expect(mockContext.clients.search.categories).toBeCalledTimes(1)
      expect(mockContext.clients.search.categories.mock.calls[0][0]).toBe(2) //ensure maximum level was correct
      expect(result!.length).toBe(2)
    })

    test('if categoryId does not match any id in categoriesIds, find biggest tree', async () => {
      const searchProduct = getProduct()
      searchProduct.categoryId = '1'
      searchProduct.categoriesIds = ['/2064927469/', '/2064927469/630877787/']
      await resolvers.Product.categoryTree(
        searchProduct as any,
        {},
        mockContext as any
      )
      expect(mockContext.clients.search.category).toBeCalledTimes(2)
      expect(mockContext.clients.search.category.mock.calls[0][0]).toBe(
        2064927469
      )
      expect(mockContext.clients.search.category.mock.calls[1][0]).toBe(
        630877787
      )
    })
  })

  test('if custom cacheId is given, it should be returned', async () => {
    const searchProduct = getProduct()
    const cacheAsSlug = await resolvers.Product.cacheId(searchProduct as any)
    expect(cacheAsSlug).toBe(searchProduct.linkText)

    searchProduct.cacheId = 'CUSTOM_CACHE'

    const customCache = await resolvers.Product.cacheId(searchProduct as any)
    expect(customCache).toBe('CUSTOM_CACHE')
  })

  test('productClusters should be properly formatted', () => {
    const product = getProduct()
    product.productClusters = {
      "140": 'Casual Footwear',
      "195": 'All products',
      "201": "Third"
    }
    const result = resolvers.Product.productClusters(product as any)
    expect(result).toMatchObject([
      { id: '140', name: 'Casual Footwear' },
      { id: '195', name: 'All products' },
      { id: '201', name: 'Third' }
    ])
  })

  test('productClusters should not break if value is null', () => {
    const product = getProduct()
    product.productClusters = null as any
    const result = resolvers.Product.productClusters(product as any)
    expect(result).toMatchObject([])
  })

  test('clusterHighlights should be properly formatted', () => {
    const product = getProduct()
    product.clusterHighlights = {
      "140": 'Casual Footwear',
      "195": 'All products',
      "201": "Third"
    }
    const result = resolvers.Product.clusterHighlights(product as any)
    expect(result).toMatchObject([
      { id: '140', name: 'Casual Footwear' },
      { id: '195', name: 'All products' },
      { id: '201', name: 'Third' }
    ])
  })

  test('clusterHighlights should not break if value is null', () => {
    const product = getProduct()
    product.clusterHighlights = null as any
    const result = resolvers.Product.clusterHighlights(product as any)
    expect(result).toMatchObject([])
  })

  test('clusterHighlights should be properly formatted', () => {
    const product = getProduct()
    product.clusterHighlights = {
      "140": 'Casual Footwear',
      "195": 'All products',
      "201": "Third"
    }
    const result = resolvers.Product.clusterHighlights(product as any)
    expect(result).toMatchObject([
      { id: '140', name: 'Casual Footwear' },
      { id: '195', name: 'All products' },
      { id: '201', name: 'Third' }
    ])
  })

  test('clusterHighlights should not break if value is null', () => {
    const product = getProduct()
    product.clusterHighlights = null as any
    const result = resolvers.Product.clusterHighlights(product as any)
    expect(result).toMatchObject([])
  })
})
