import type { IOContext } from '@vtex/api'

import { CatalogDataplane } from './catalog-dataplane'

function createTestClient(
  overrides: Partial<IOContext> = {}
): CatalogDataplane {
  const ctx = {
    account: 'testaccount',
    workspace: 'master',
    authToken: 'app-token',
    production: true,
    region: 'aws-us-east-1',
    requestId: 'req-1',
    operationId: 'op-1',
    ...overrides,
  } as unknown as IOContext

  const client = new CatalogDataplane(ctx)

  ;(client as unknown as { http: unknown }).http = {
    get: jest.fn().mockResolvedValue({ categories: [] }),
  }

  return client
}

function lastGetCall(client: CatalogDataplane) {
  const httpGet = (client as unknown as { http: { get: jest.Mock } }).http.get

  return httpGet.mock.calls[0] as [string, { headers: Record<string, string> }]
}

describe('CatalogDataplane#productById', () => {
  it('calls the private catalog query path', async () => {
    const client = createTestClient()

    await client.productById(42)

    const [path] = lastGetCall(client)

    expect(path).toBe('/api/catalog/query/pvt/product/42')
  })

  it('sends the app auth token as VtexIdclientAutCookie', async () => {
    const client = createTestClient({
      storeUserAuthToken: 'store-token',
      adminUserAuthToken: 'admin-token',
    })

    await client.productById(1)

    const [, requestConfig] = lastGetCall(client)

    expect(requestConfig.headers.VtexIdclientAutCookie).toBe('app-token')
    expect(requestConfig.headers).not.toHaveProperty('Authorization')
  })

  it('forwards Accept-Language when provided', async () => {
    const client = createTestClient()

    await client.productById(1, 'pt-BR')

    const [, requestConfig] = lastGetCall(client)

    expect(requestConfig.headers['Accept-Language']).toBe('pt-BR')
  })

  it('omits Accept-Language when not provided', async () => {
    const client = createTestClient()

    await client.productById(1)

    const [, requestConfig] = lastGetCall(client)

    expect(requestConfig.headers).not.toHaveProperty('Accept-Language')
  })
})
