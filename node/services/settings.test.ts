import { fetchAppSettings } from './settings'
import { createContext } from '../mocks/contextFactory'

describe('fetchAppSettings', () => {
  it('returns enableHybridSearch from app settings when set', async () => {
    const ctx = createContext({
      appSettings: {
        shouldUseNewPDPEndpoint: false,
        enableHybridSearch: true,
      },
    })

    const settings = await fetchAppSettings(ctx)

    expect(settings.enableHybridSearch).toBe(true)
  })

  it('defaults enableHybridSearch to false when not set', async () => {
    const ctx = createContext({
      appSettings: {
        shouldUseNewPDPEndpoint: false,
      },
    })

    const settings = await fetchAppSettings(ctx)

    expect(settings.enableHybridSearch).toBe(false)
  })

  it('defaults enableHybridSearch to false when getAppSettings throws', async () => {
    const ctx = createContext({})

    jest
      .spyOn((ctx as any).clients.apps, 'getAppSettings')
      .mockImplementation()
      .mockRejectedValue(new Error('boom'))

    const settings = await fetchAppSettings(ctx)

    expect(settings.enableHybridSearch).toBe(false)
  })

  it('does not expose shouldUseNewPLPEndpoint', async () => {
    const ctx = createContext({
      appSettings: {
        shouldUseNewPDPEndpoint: false,
        shouldUseNewPLPEndpoint: false,
      } as any,
    })

    const settings = await fetchAppSettings(ctx)

    expect(settings).not.toHaveProperty('shouldUseNewPLPEndpoint')
  })
})
