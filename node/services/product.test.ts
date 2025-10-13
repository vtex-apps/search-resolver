import { fetchProduct } from './product'
import { createContext } from '../mocks/contextFactory'

describe('fetchProduct service', () => {
  const mockProduct = {
    productId: 'test-product',
    productName: 'Test Product',
    brand: 'Test Brand',
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should use intsch directly for b2bstoreqa account', async () => {
    const ctx = createContext({
      accountName: 'b2bstoreqa',
    })

    // Mock the intsch client to return a product
    ctx.clients.intsch.fetchProduct = jest.fn().mockResolvedValue(mockProduct)
    
    const args = {
      identifier: { field: 'id' as const, value: 'test-id' },
      salesChannel: 1,
    }

    const result = await fetchProduct(ctx as any, args)

    expect(ctx.clients.intsch.fetchProduct).toHaveBeenCalled()
    expect(result).toEqual([mockProduct])
  })

  it('should use intsch directly for biggy account', async () => {
    const ctx = createContext({
      accountName: 'biggy',
    })

    // Mock the intsch client to return a product
    ctx.clients.intsch.fetchProduct = jest.fn().mockResolvedValue(mockProduct)
    
    const args = {
      identifier: { field: 'id' as const, value: 'test-id' },
      salesChannel: 1,
    }

    const result = await fetchProduct(ctx as any, args)

    expect(ctx.clients.intsch.fetchProduct).toHaveBeenCalled()
    expect(result).toEqual([mockProduct])
  })
})
