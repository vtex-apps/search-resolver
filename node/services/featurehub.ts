import type { ClientContext } from 'featurehub-javascript-node-sdk'
import { EdgeFeatureHubConfig } from 'featurehub-javascript-node-sdk'

const FEATUREHUB_EDGE_URL = 'https://flags.vtex.com/'

const FEATUREHUB_CLIENT_API_KEY = ''

let fhConfig: EdgeFeatureHubConfig | null = null
let ready = false

export async function initFeatureHub(): Promise<void> {
  if (fhConfig) {
    return
  }

  fhConfig = new EdgeFeatureHubConfig(
    FEATUREHUB_EDGE_URL,
    FEATUREHUB_CLIENT_API_KEY
  )

  // SSE (Server Sent Events) is the default for featurehub-javascript-node-sdk
  // It provides near real-time updates without polling
  fhConfig.init()

  await new Promise<void>((resolve) => {
    if (!fhConfig) return

    fhConfig.addReadynessListener(
      (_readiness: unknown, firstTimeReady: boolean) => {
        if (firstTimeReady) {
          ready = true
          resolve()
        }
      }
    )
  })
}

export interface FlagEvaluator {
  getBoolean(flagKey: string, defaultValue: boolean): Promise<boolean>
}

export async function createEvaluator(account: string): Promise<FlagEvaluator> {
  if (!fhConfig || !ready) {
    return {
      getBoolean: (_flagKey, defaultValue) => Promise.resolve(defaultValue),
    }
  }

  const clientContext = await buildContext(account)

  return {
    getBoolean: async (flagKey, defaultValue) => {
      if (!clientContext.isSet(flagKey)) {
        return defaultValue
      }

      const value = clientContext.getBoolean(flagKey)

      if (value === null || value === undefined) {
        return defaultValue
      }

      return value
    },
  }
}

async function buildContext(account: string): Promise<ClientContext> {
  if (!fhConfig) {
    throw new Error('FeatureHub not initialized')
  }

  const ctx = fhConfig
    .newContext()
    .userKey(account)
    .attributeValue('account', account)

  return ctx.build()
}
