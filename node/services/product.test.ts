import { fetchProduct, buildVtexSegment } from './product'
import { createContext } from '../mocks/contextFactory'

jest.mock('./featurehub', () => ({
  evaluateBooleanFlag: jest.fn(),
}))

const { evaluateBooleanFlag } = jest.requireMock('./featurehub')
const mockEvaluateBooleanFlag = evaluateBooleanFlag as jest.Mock

describe('fetchProduct service', () => {
  const mockProduct = {
    productId: 'test-product',
    productName: 'Test Product',
    brand: 'Test Brand',
  } as SearchProduct

  beforeEach(() => {
    jest.clearAllMocks()
    // Default: legacy only (no shadow, no migration complete)
    mockEvaluateBooleanFlag.mockResolvedValue({
      value: false,
      flagFound: true,
    })
  })

  it('should build vtex segment correctly', () => {
    const vtexSegment = buildVtexSegment({
      vtexSegment: {
        campaigns: null,
        channel: '1',
        priceTables: null,
        regionId: 'U1cjMQ==',
        utm_campaign: null,
        utm_source: null,
        utmi_campaign: null,
        currencyCode: 'ARS',
        currencySymbol: '$',
        countryCode: 'ARG',
        cultureInfo: 'es-AR',
        admin_cultureInfo: 'es-AR',
        channelPrivacy: 'public',
      },
      salesChannel: '2',
      regionId: '3',
    })

    const result = JSON.parse(Buffer.from(vtexSegment, 'base64').toString())

    expect(result.regionId).toBe('3')
    expect(result.countryCode).toBe('ARG')
    expect(result.currencySymbol).toBe('$')
    expect(result.currencyCode).toBe('ARS')
    expect(result.channel).toBe('2')
    expect(result.cultureInfo).toBe('es-AR')
    expect(result.admin_cultureInfo).toBe('es-AR')
    expect(result.channelPrivacy).toBe('public')
    expect(result.campaigns).toBeNull()
    expect(result.priceTables).toBeNull()
    expect(result.utm_campaign).toBeNull()
    expect(result.utm_source).toBeNull()
    expect(result.utmi_campaign).toBeNull()
  })

  it('should use intsch when FeatureHub migrationComplete is true', async () => {
    mockEvaluateBooleanFlag
      .mockResolvedValueOnce({ value: true, flagFound: true })
      .mockResolvedValueOnce({ value: false, flagFound: true })
      .mockResolvedValueOnce({ value: false, flagFound: true })

    const ctx = createContext({ accountName: 'b2bstoreqa' })

    jest
      .spyOn(ctx.clients.intsch, 'fetchProduct')
      .mockImplementation(
        () => Promise.resolve(mockProduct) as Promise<SearchProduct>
      )

    const args = {
      identifier: { field: 'id' as const, value: 'test-id' },
      salesChannel: 1,
    }

    const result = await fetchProduct(ctx, args)

    expect(ctx.clients.intsch.fetchProduct).toHaveBeenCalled()
    expect(result).toEqual([mockProduct])
    expect(ctx.translated).toBe(true)
  })

  it('should use search (legacy) when FeatureHub flags are all false', async () => {
    const ctx = createContext({ accountName: 'biggy' })
    const productById = jest.fn().mockResolvedValue([mockProduct])
    const clients = ctx.clients as unknown as {
      search: { productById: jest.Mock }
    }

    clients.search = { productById }

    const args = {
      identifier: { field: 'id' as const, value: 'test-id' },
      salesChannel: 1,
    }

    const result = await fetchProduct(ctx, args)

    expect(productById).toHaveBeenCalled()
    expect(result).toEqual([mockProduct])
    expect(ctx.translated).toBeUndefined()
  })
})
