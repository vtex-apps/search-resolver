import { fetchProduct, resolveProductsByIdentifier } from './product'
import { createContext } from '../mocks/contextFactory'

function createNotFoundError() {
  return Object.assign(new Error('Request failed with status code 404'), {
    response: { status: 404, data: { code: 'PRODUCT_NOT_FOUND' } },
  })
}

function createServerError() {
  return Object.assign(new Error('Request failed with status code 500'), {
    response: { status: 500 },
  })
}

describe('fetchProduct service', () => {
  const mockProduct = {
    productId: 'test-product',
    productName: 'Test Product',
    brand: 'Test Brand',
  } as SearchProduct

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should use intsch directly for b2bstoreqa account', async () => {
    const ctx = createContext({
      accountName: 'b2bstoreqa',
      appSettings: {
        shouldUseNewPDPEndpoint: true,
      },
    })

    // Mock the intsch client to return a product
    jest
      .spyOn(ctx.clients.intsch, 'fetchProduct')
      .mockImplementation()
      .mockResolvedValue(mockProduct)

    const args = {
      identifier: { field: 'id' as const, value: 'test-id' },
      salesChannel: 1,
    }

    const result = await fetchProduct(ctx, args)

    expect(ctx.clients.intsch.fetchProduct).toHaveBeenCalled()
    expect(result).toEqual([mockProduct])
  })

  it('should use intsch directly for biggy account', async () => {
    const ctx = createContext({
      accountName: 'biggy',
      appSettings: {
        shouldUseNewPDPEndpoint: true,
      },
    })

    // Mock the intsch client to return a product
    jest
      .spyOn(ctx.clients.intsch, 'fetchProduct')
      .mockImplementation()
      .mockResolvedValue(mockProduct)

    const args = {
      identifier: { field: 'id' as const, value: 'test-id' },
      salesChannel: 1,
    }

    const result = await fetchProduct(ctx, args)

    expect(ctx.clients.intsch.fetchProduct).toHaveBeenCalled()
    expect(result).toEqual([mockProduct])
  })

  it('should forward segment priceTables to intsch and let salesChannel win', async () => {
    const ctx = createContext({
      appSettings: { shouldUseNewPDPEndpoint: true },
      segment: {
        channel: '2',
        priceTables: 'pl-001',
        regionId: 'v2.1BB18CE648B5111D0933734ED83EC783',
        cultureInfo: 'es-CL',
      } as any,
    })

    jest
      .spyOn(ctx.clients.intsch, 'fetchProduct')
      .mockResolvedValue(mockProduct)

    await fetchProduct(ctx, {
      identifier: { field: 'id', value: '1322' },
      salesChannel: 1,
    })

    expect(ctx.clients.intsch.fetchProduct).toHaveBeenCalledWith(
      expect.objectContaining({
        field: 'id',
        value: '1322',
        salesChannel: '1',
        productOriginVtex: true,
      }),
      {
        segmentParams: expect.objectContaining({
          sc: '2',
          priceTables: 'pl-001',
          regionId: 'v2.1BB18CE648B5111D0933734ED83EC783',
        }),
      }
    )
  })

  it('should return empty array when intsch product is not found', async () => {
    const ctx = createContext({
      appSettings: { shouldUseNewPDPEndpoint: true },
    })

    jest
      .spyOn(ctx.clients.intsch, 'fetchProduct')
      .mockRejectedValue(createNotFoundError())

    const result = await fetchProduct(ctx, {
      identifier: { field: 'id', value: 'missing-id' },
      salesChannel: 1,
    })

    expect(result).toEqual([])
  })

  it('should propagate non-404 intsch errors for single product fetch', async () => {
    const ctx = createContext({
      appSettings: { shouldUseNewPDPEndpoint: true },
    })

    jest
      .spyOn(ctx.clients.intsch, 'fetchProduct')
      .mockRejectedValue(createServerError())

    await expect(
      fetchProduct(ctx, {
        identifier: { field: 'id', value: 'test-id' },
        salesChannel: 1,
      })
    ).rejects.toThrow('Request failed with status code 500')
  })
})

describe('resolveProductsByIdentifier service', () => {
  const existingProduct = {
    productId: '2000037',
    productName: 'GMK Truffle Space',
  } as SearchProduct

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return only found products when batch contains missing IDs', async () => {
    const ctx = createContext({
      appSettings: { shouldUseNewPDPEndpoint: true },
    })

    jest
      .spyOn(ctx.clients.intsch, 'fetchProduct')
      .mockImplementation(({ value }) => {
        if (value === '2000037') {
          return Promise.resolve(existingProduct)
        }

        return Promise.reject(createNotFoundError())
      })

    const result = await resolveProductsByIdentifier(ctx, {
      field: 'id',
      values: ['2000037', '2000045'],
      salesChannel: '1',
    })

    expect(result).toEqual([existingProduct])
    expect(ctx.clients.intsch.fetchProduct).toHaveBeenCalledTimes(2)
  })

  it('should propagate non-404 intsch errors in batch fetch', async () => {
    const ctx = createContext({
      appSettings: { shouldUseNewPDPEndpoint: true },
    })

    jest
      .spyOn(ctx.clients.intsch, 'fetchProduct')
      .mockImplementation(({ value }) => {
        if (value === '2000037') {
          return Promise.resolve(existingProduct)
        }

        return Promise.reject(createServerError())
      })

    await expect(
      resolveProductsByIdentifier(ctx, {
        field: 'id',
        values: ['2000037', '2000045'],
        salesChannel: '1',
      })
    ).rejects.toThrow('Request failed with status code 500')
  })
})
