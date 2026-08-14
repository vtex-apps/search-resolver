type AppSettings = {
  shouldUseNewPDPEndpoint: boolean
  shouldUseNewPLPEndpoint: boolean
  enableHybridSearch: boolean
  enableDeliveryPromisePreview: boolean
}

const FORCE_NEW_PLP_HEADER = 'x-vtex-force-new-plp-endpoint'
const FORCE_NEW_PDP_HEADER = 'x-vtex-force-new-pdp-endpoint'

export async function fetchAppSettings(ctx: Context): Promise<AppSettings> {
  const {
    clients: { apps },
  } = ctx

  const forceNewPLP = ctx.get(FORCE_NEW_PLP_HEADER) === 'true'
  const forceNewPDP = ctx.get(FORCE_NEW_PDP_HEADER) === 'true'

  try {
    const {
      shouldUseNewPDPEndpoint,
      shouldUseNewPLPEndpoint,
      enableHybridSearch,
      enableDeliveryPromisePreview,
    }: AppSettings = await apps.getAppSettings('vtex.search-resolver@1.x')

    return {
      shouldUseNewPDPEndpoint: forceNewPDP || shouldUseNewPDPEndpoint,
      shouldUseNewPLPEndpoint: forceNewPLP || (shouldUseNewPLPEndpoint ?? true),
      enableHybridSearch: enableHybridSearch ?? false,
      enableDeliveryPromisePreview: enableDeliveryPromisePreview ?? false,
    }
  } catch (error) {
    ctx.vtex.logger.error({
      message: 'Error fetching app settings',
      error: error.message,
    })

    return {
      shouldUseNewPDPEndpoint: forceNewPDP,
      // Defaults to true (matches the new manifest default) — the legacy
      // client is no longer the safe fallback when settings can't be read.
      shouldUseNewPLPEndpoint: true,
      enableHybridSearch: false,
      enableDeliveryPromisePreview: false,
    }
  }
}
