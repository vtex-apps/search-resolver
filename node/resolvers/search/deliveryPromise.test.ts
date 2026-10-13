import { queries } from './index'
import { createContext } from '../../mocks/contextFactory'

function contextWith(options: Parameters<typeof createContext>[0]) {
  const ctx = createContext<any>(options)

  ctx.clients.intsch.pickupPointAvailability = jest
    .fn()
    .mockResolvedValue({ pickupPointDistances: [] })
  ctx.clients.intsch.catalogCount = jest.fn().mockResolvedValue({ total: 7 })

  return ctx
}

describe('pickupPointAvailability query', () => {
  const args = { salesChannel: '1', zipCode: '01310-100', country: 'BRA' }

  it('sends dpPreview=true when enableDeliveryPromisePreview is on', async () => {
    const ctx = contextWith({
      appSettings: { enableDeliveryPromisePreview: true },
    })

    const result = await queries.pickupPointAvailability({}, args, ctx)

    expect(ctx.clients.intsch.pickupPointAvailability).toHaveBeenCalledWith({
      ...args,
      dpPreview: true,
    })
    expect(result).toEqual({ pickupPointDistances: [] })
  })

  it('sends dpPreview=false when enableDeliveryPromisePreview is off', async () => {
    const ctx = contextWith({ appSettings: {} })

    await queries.pickupPointAvailability({}, args, ctx)

    expect(ctx.clients.intsch.pickupPointAvailability).toHaveBeenCalledWith({
      ...args,
      dpPreview: false,
    })
  })
})

describe('catalogCount query', () => {
  it('sends dpPreview=true when enableDeliveryPromisePreview is on', async () => {
    const ctx = contextWith({
      appSettings: { enableDeliveryPromisePreview: true },
    })

    const result = await queries.catalogCount(
      {},
      { zipCode: '01310-100', salesChannel: '2' },
      ctx
    )

    expect(ctx.clients.intsch.catalogCount).toHaveBeenCalledWith({
      zipCode: '01310-100',
      salesChannel: '2',
      dpPreview: true,
    })
    expect(result).toEqual({ total: 7 })
  })

  it('sends dpPreview=false when enableDeliveryPromisePreview is off', async () => {
    const ctx = contextWith({ appSettings: {} })

    await queries.catalogCount({}, { zipCode: '01310-100', salesChannel: '2' }, ctx)

    expect(ctx.clients.intsch.catalogCount).toHaveBeenCalledWith(
      expect.objectContaining({ dpPreview: false })
    )
  })

  it('falls back to the segment sales channel when no salesChannel arg is given', async () => {
    const ctx = contextWith({
      appSettings: {},
      segment: { channel: 3 } as any,
    })

    await queries.catalogCount({}, { zipCode: '01310-100' }, ctx)

    expect(ctx.clients.intsch.catalogCount).toHaveBeenCalledWith(
      expect.objectContaining({ salesChannel: '3' })
    )
  })

  it('falls back to the segment sales channel when salesChannel arg is empty', async () => {
    const ctx = contextWith({
      appSettings: {},
      segment: { channel: 3 } as any,
    })

    await queries.catalogCount({}, { zipCode: '01310-100', salesChannel: '' }, ctx)

    expect(ctx.clients.intsch.catalogCount).toHaveBeenCalledWith(
      expect.objectContaining({ salesChannel: '3' })
    )
  })

  it('sends no sales channel when neither arg nor segment has one', async () => {
    const ctx = contextWith({ appSettings: {} })

    await queries.catalogCount({}, { zipCode: '01310-100' }, ctx)

    const [callArgs] = ctx.clients.intsch.catalogCount.mock.calls[0]

    expect(callArgs.salesChannel).toBeUndefined()
  })
})
