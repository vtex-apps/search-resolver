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

    jest
      .spyOn((ctx as any).clients.apps, 'getAppSettings')
      .mockImplementation()
      .mockRejectedValue(new Error('boom'))

    const settings = await fetchAppSettings(ctx)

    expect(settings.enableHybridSearch).toBe(false)
  })

  it('defaults shouldUseNewPLPEndpoint to true when not set', async () => {
    const ctx = createContext({
      appSettings: {
        shouldUseNewPDPEndpoint: false,
      },
    })

    const settings = await fetchAppSettings(ctx)

    expect(settings.shouldUseNewPLPEndpoint).toBe(true)
  })

  it('respects an explicit shouldUseNewPLPEndpoint: false setting', async () => {
    const ctx = createContext({
      appSettings: {
        shouldUseNewPLPEndpoint: false,
      },
    })

    const settings = await fetchAppSettings(ctx)

    expect(settings.shouldUseNewPLPEndpoint).toBe(false)
  })

  it('defaults shouldUseNewPLPEndpoint to true when getAppSettings throws', async () => {
    const ctx = createContext({})

    jest
      .spyOn((ctx as any).clients.apps, 'getAppSettings')
      .mockImplementation()
      .mockRejectedValue(new Error('boom'))

    const settings = await fetchAppSettings(ctx)

    expect(settings.shouldUseNewPLPEndpoint).toBe(true)
  })
})
