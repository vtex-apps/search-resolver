import { fetchAppSettings } from './settings'
import { createContext } from '../mocks/contextFactory'

describe('fetchAppSettings', () => {
  it('returns enableHybridSearch from app settings when set', async () => {
    const ctx = createContext({
      appSettings: {
        shouldUseNewPDPEndpoint: false,
        shouldUseNewPLPEndpoint: true,
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
        shouldUseNewPLPEndpoint: false,
      },
    })

    const settings = await fetchAppSettings(ctx)

    expect(settings.enableHybridSearch).toBe(false)
  })

  it('defaults enableHybridSearch to false when getAppSettings throws', async () => {
    const ctx = createContext({})

    ;(ctx as any).clients.apps.getAppSettings = jest
      .fn()
      .mockRejectedValue(new Error('boom'))

    const settings = await fetchAppSettings(ctx)

    expect(settings.enableHybridSearch).toBe(false)
  })
})
