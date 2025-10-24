import parse from 'co-body'

import type { IntelligentSearchClientArgs } from './intsch'
import { MockedIntschClient } from './intsch'
import type { SegmentData } from '../typings/Search'

export function createContext<Ctx = Context>({
  accountName,
  intelligentSearchApiSettings,
  intschSettings,
  cookies,
  body,
  req,
  query,
  production,
  appSettings,
  segment,
  tenantLocale,
  vtexLocale,
}: {
  production?: boolean
  appSettings?: Record<string, any>
  intschSettings?: IntelligentSearchClientArgs
  intelligentSearchApiSettings?: IntelligentSearchClientArgs
  req?: {
    body?: any
  }
  query?: Record<string, unknown>
  body?: any
  cookies?: Record<string, string>
  accountName?: string
  segment?: SegmentData
  tenantLocale?: string
  vtexLocale?: string
}) {
  if (req?.body instanceof Error) {
    jest.spyOn(parse, 'json').mockRejectedValue(req.body)
  } else {
    jest.spyOn(parse, 'json').mockReturnValue(req?.body ?? {})
  }

  return {
    req: {},
    body: body ?? {},
    cookies: {
      get: jest.fn().mockImplementation((key: string) => cookies?.[key]),
    },
    get: jest.fn().mockReturnValue('localhost'),
    response: {
      set: jest.fn(),
    },
    clients: {
      intsch: new MockedIntschClient(intschSettings),
      intelligentSearchApi: new MockedIntschClient(
        intelligentSearchApiSettings
      ),
      apps: {
        getAppSettings: jest.fn().mockReturnValue(appSettings ?? {}),
      },
      vbase: {
        getJSON: jest.fn().mockResolvedValue({}),
      }
    },
    vtex: {
      production: production ?? false,
      account: accountName ?? 'biggy',
      logger: {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
      },
      segment,
      tenant: {
        locale: tenantLocale,
      },
      locale: vtexLocale,
    },
    query: query ?? {},
  } as unknown as Ctx
}
