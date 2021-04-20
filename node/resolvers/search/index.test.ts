import { queries } from './index'
import { mockContext } from '../../__mocks__/helpers'
import { getProduct, getItem } from '../../__mocks__/product'

beforeEach(() => {
  jest.clearAllMocks()
})

describe('product recommendations query tests', () => {
  it('if productRecommendations products have correct custom cacheId', async () => {
    const product1 = getProduct()
    const product2 = getProduct()

    const item1 = getItem()
    const item2 = getItem('2')

    product1.items = [item1 as any]
    product2.items = [item2 as any]
    mockContext.clients.search.crossSelling.mockImplementation(() => [
      product1,
      product2,
    ])
    const results = await queries.productRecommendations(
      {},
      { identifier: { field: 'id', value: '1' }, type: 'similars' as any },
      mockContext as any
    )

    expect(results.every(p => Boolean(p.cacheId))).toBeTruthy()
    expect(results[0].cacheId).toBe('classic-shoes-1')
    expect(results[1].cacheId).toBe('classic-shoes-2')
  })

  it('ensure correct types call the correct APIs', async () => {
    mockContext.clients.search.crossSelling.mockImplementation(() => [])
    await queries.productRecommendations(
      {},
      { identifier: { field: 'id', value: '1' }, type: 'similars' as any },
      mockContext as any
    )
    expect(mockContext.clients.search.crossSelling.mock.calls[0][1]).toBe(
      'similars'
    )

    await queries.productRecommendations(
      {},
      { identifier: { field: 'id', value: '1' }, type: 'view' as any },
      mockContext as any
    )
    expect(mockContext.clients.search.crossSelling.mock.calls[1][1]).toBe(
      'whosawalsosaw'
    )

    await queries.productRecommendations(
      {},
      { identifier: { field: 'id', value: '1' }, type: 'buy' as any },
      mockContext as any
    )
    expect(mockContext.clients.search.crossSelling.mock.calls[2][1]).toBe(
      'whoboughtalsobought'
    )

    await queries.productRecommendations(
      {},
      { identifier: { field: 'id', value: '1' }, type: 'viewAndBought' as any },
      mockContext as any
    )
    expect(mockContext.clients.search.crossSelling.mock.calls[3][1]).toBe(
      'whosawalsobought'
    )

    await queries.productRecommendations(
      {},
      { identifier: { field: 'id', value: '1' }, type: 'suggestions' as any },
      mockContext as any
    )
    expect(mockContext.clients.search.crossSelling.mock.calls[4][1]).toBe(
      'suggestions'
    )

    await queries.productRecommendations(
      {},
      { identifier: { field: 'id', value: '1' }, type: 'accessories' as any },
      mockContext as any
    )
    expect(mockContext.clients.search.crossSelling.mock.calls[5][1]).toBe(
      'accessories'
    )
  })
})
