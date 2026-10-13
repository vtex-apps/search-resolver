import type { IOContext } from '@vtex/api'

import { Intsch } from './index'

function createTestClient(): Intsch {
  const ctx = {
    account: 'testaccount',
    workspace: 'master',
    authToken: 'test-token',
    production: true,
    region: 'aws-us-east-1',
    requestId: 'req-1',
    operationId: 'op-1',
  } as unknown as IOContext

  const client = new Intsch(ctx)

  ;(client as unknown as { http: unknown }).http = {
    get: jest.fn().mockResolvedValue({ productId: '1322' }),
    getRaw: jest
      .fn()
      .mockResolvedValue({ data: { products: [] }, headers: {} }),
  }

  return client
}

describe('Intsch#productSearch semantic params', () => {
  it('forwards semanticRatio when set', async () => {
    const client = createTestClient()

    await client.productSearch({ semanticRatio: 0.5 } as any, 'some/path')

    const httpGetRaw = (client as any).http.getRaw as jest.Mock
    const [, requestConfig] = httpGetRaw.mock.calls[0]

    expect(requestConfig.params).toMatchObject({ semanticRatio: 0.5 })
  })

  it('omits semanticRatio when not provided', async () => {
    const client = createTestClient()

    await client.productSearch({} as any, 'some/path')

    const httpGetRaw = (client as any).http.getRaw as jest.Mock
    const [, requestConfig] = httpGetRaw.mock.calls[0]

    expect(requestConfig.params).not.toHaveProperty('semanticRatio')
  })

  it('forwards priceTables from segmentParams and lets salesChannel win', async () => {
    const client = createTestClient()

    await client.productSearch({ salesChannel: '1' } as any, 'bravecto', {
      segmentParams: {
        sc: '2',
        priceTables: 'pl-001',
        regionId: 'v2.SEGMENT',
      },
    })

    const httpGetRaw = (client as any).http.getRaw as jest.Mock
    const [, requestConfig] = httpGetRaw.mock.calls[0]

    expect(requestConfig.params).toMatchObject({
      sc: '1',
      priceTables: 'pl-001',
      regionId: 'v2.SEGMENT',
    })
  })
})

describe('Intsch#fetchProduct segment params', () => {
  const identifier = {
    field: 'id' as const,
    value: '1322',
    productOriginVtex: true,
  }

  const segmentParams = {
    sc: '2',
    regionId: 'v2.1BB18CE648B5111D0933734ED83EC783',
    priceTables: 'pl-001',
  }

  it('forwards priceTables and regionId from segmentParams', async () => {
    const client = createTestClient()

    await client.fetchProduct(identifier, { segmentParams })

    const httpGet = (client as any).http.get as jest.Mock
    const [, requestConfig] = httpGet.mock.calls[0]

    expect(requestConfig.params).toMatchObject({
      field: 'id',
      value: '1322',
      sc: '2',
      regionId: 'v2.1BB18CE648B5111D0933734ED83EC783',
      priceTables: 'pl-001',
    })
  })

  it('lets args.salesChannel win over segment sc', async () => {
    const client = createTestClient()

    await client.fetchProduct(
      { ...identifier, salesChannel: '1' },
      { segmentParams }
    )

    const httpGet = (client as any).http.get as jest.Mock
    const [, requestConfig] = httpGet.mock.calls[0]

    expect(requestConfig.params.sc).toBe('1')
    expect(requestConfig.params.priceTables).toBe('pl-001')
  })

  it('does not default sc to 1 when salesChannel and segment sc are absent', async () => {
    const client = createTestClient()

    await client.fetchProduct(identifier)

    const httpGet = (client as any).http.get as jest.Mock
    const [, requestConfig] = httpGet.mock.calls[0]

    expect(requestConfig.params).not.toHaveProperty('sc')
  })
})

describe('Intsch#pickupPointAvailability', () => {
  const baseArgs = { salesChannel: '1', zipCode: '01310-100', country: 'BRA' }

  it('sends sc, zip-code and country as query params', async () => {
    const client = createTestClient()

    await client.pickupPointAvailability(baseArgs)

    const httpGet = (client as any).http.get as jest.Mock
    const [path, requestConfig] = httpGet.mock.calls[0]

    expect(path).toBe('/api/intelligent-search/v0/pickup-point-availability')
    expect(requestConfig.params).toEqual({
      sc: '1',
      'zip-code': '01310-100',
      country: 'BRA',
    })
  })

  it('sends coordinates when given', async () => {
    const client = createTestClient()

    await client.pickupPointAvailability({
      ...baseArgs,
      coordinates: '-46.65,-23.56',
    })

    const httpGet = (client as any).http.get as jest.Mock
    const [, requestConfig] = httpGet.mock.calls[0]

    expect(requestConfig.params).toMatchObject({ coordinates: '-46.65,-23.56' })
  })

  it('sends dpPreview=true when enabled', async () => {
    const client = createTestClient()

    await client.pickupPointAvailability({ ...baseArgs, dpPreview: true })

    const httpGet = (client as any).http.get as jest.Mock
    const [, requestConfig] = httpGet.mock.calls[0]

    expect(requestConfig.params).toMatchObject({ dpPreview: 'true' })
  })

  it('omits dpPreview when disabled', async () => {
    const client = createTestClient()

    await client.pickupPointAvailability({ ...baseArgs, dpPreview: false })

    const httpGet = (client as any).http.get as jest.Mock
    const [, requestConfig] = httpGet.mock.calls[0]

    expect(requestConfig.params).not.toHaveProperty('dpPreview')
  })
})

describe('Intsch#catalogCount', () => {
  it('omits sc when no sales channel is given', async () => {
    const client = createTestClient()

    await client.catalogCount({ zipCode: '01310-100', coordinates: '1,2' })

    const httpGet = (client as any).http.get as jest.Mock
    const [path, requestConfig] = httpGet.mock.calls[0]

    expect(path).toBe('/api/intelligent-search/v1/catalog-count')
    expect(requestConfig.params).toEqual({
      'zip-code': '01310-100',
      coordinates: '1,2',
    })
  })

  it('sends the sales channel as sc when given', async () => {
    const client = createTestClient()

    await client.catalogCount({ zipCode: '01310-100', salesChannel: '2' })

    const httpGet = (client as any).http.get as jest.Mock
    const [path, requestConfig] = httpGet.mock.calls[0]

    expect(path).toBe('/api/intelligent-search/v1/catalog-count')
    expect(requestConfig.params).toMatchObject({ sc: '2' })
  })

  it('sends dpPreview=true when enabled', async () => {
    const client = createTestClient()

    await client.catalogCount({ zipCode: '01310-100', dpPreview: true })

    const httpGet = (client as any).http.get as jest.Mock
    const [, requestConfig] = httpGet.mock.calls[0]

    expect(requestConfig.params).toMatchObject({ dpPreview: 'true' })
  })

  it('omits dpPreview when disabled', async () => {
    const client = createTestClient()

    await client.catalogCount({ zipCode: '01310-100', dpPreview: false })

    const httpGet = (client as any).http.get as jest.Mock
    const [, requestConfig] = httpGet.mock.calls[0]

    expect(requestConfig.params).not.toHaveProperty('dpPreview')
  })
})
