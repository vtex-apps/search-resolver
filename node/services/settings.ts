type AppSettings = {
  shouldUseNewPDPEndpoint: boolean
  enableHybridSearch: boolean
  enableDeliveryPromisePreview: boolean
}

const FORCE_NEW_PDP_HEADER = 'x-vtex-force-new-pdp-endpoint'

export async function fetchAppSettings(ctx: Context): Promise<AppSettings> {
  const {
    clients: { apps },
  } = ctx

  const forceNewPDP = ctx.get(FORCE_NEW_PDP_HEADER) === 'true'

  try {
    const {
      shouldUseNewPDPEndpoint,
      enableHybridSearch,
      enableDeliveryPromisePreview,
    }: AppSettings = await apps.getAppSettings('vtex.search-resolver@1.x')

    return {
      shouldUseNewPDPEndpoint: forceNewPDP || shouldUseNewPDPEndpoint,
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
      enableHybridSearch: false,
      enableDeliveryPromisePreview: false,
    }
  }
}
