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
})
