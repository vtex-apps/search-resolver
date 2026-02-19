import type { ClientContext } from 'featurehub-javascript-node-sdk'
import { EdgeFeatureHubConfig } from 'featurehub-javascript-node-sdk'

const FEATUREHUB_EDGE_URL = 'https://flags.vtex.com/'

const FEATUREHUB_CLIENT_API_KEY =
  '1a066a06-65c2-481a-b6f5-bc0c5bb3a565/Jxzg2n5WRLGbrVN8UrqD0jz4wOV6ln*FnKz6GX1TV16NAL2Jzmj'

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

export async function evaluateBooleanFlag(
  flagKey: string,
  defaultValue: boolean,
  context?: Record<string, string>
): Promise<{ value: boolean; flagFound: boolean }> {
  if (!fhConfig || !ready) {
    return { value: defaultValue, flagFound: false }
  }

  const clientContext = await buildContext(context)

  if (!clientContext.isSet(flagKey)) {
    return { value: defaultValue, flagFound: false }
  }

  const value = clientContext.getBoolean(flagKey)

  if (value === null || value === undefined) {
    return { value: defaultValue, flagFound: false }
  }

  return { value, flagFound: true }
}

export async function evaluateStringFlag(
  flagKey: string,
  defaultValue: string,
  context?: Record<string, string>
): Promise<{ value: string; flagFound: boolean }> {
  if (!fhConfig || !ready) {
    return { value: defaultValue, flagFound: false }
  }

  const clientContext = await buildContext(context)

  if (!clientContext.isSet(flagKey)) {
    return { value: defaultValue, flagFound: false }
  }

  const value = clientContext.getString(flagKey)

  if (value === null || value === undefined) {
    return { value: defaultValue, flagFound: false }
  }

  return { value, flagFound: true }
}

async function buildContext(
  attrs?: Record<string, string>
): Promise<ClientContext> {
  if (!fhConfig) {
    throw new Error('FeatureHub not initialized')
  }

  let ctx = fhConfig.newContext()

  if (attrs) {
    for (const [key, val] of Object.entries(attrs)) {
      if (key === 'userKey' || key === 'targetingKey') {
        ctx = ctx.userKey(val)
      } else if (key === 'sessionKey') {
        ctx = ctx.sessionKey(val)
      } else if (key === 'version') {
        ctx = ctx.version(val)
      } else {
        ctx = ctx.attributeValue(key, val)
      }
    }
  }

  ctx = await ctx.build()

  return ctx
}
