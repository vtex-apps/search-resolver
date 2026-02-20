type AppSettings = {
  shouldUseNewPDPEndpoint: boolean
  shouldUseNewPLPEndpoint: boolean
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
    const { shouldUseNewPDPEndpoint, shouldUseNewPLPEndpoint }: AppSettings =
      await apps.getAppSettings('vtex.search-resolver@1.x')

    return {
      shouldUseNewPDPEndpoint: forceNewPDP || shouldUseNewPDPEndpoint,
      shouldUseNewPLPEndpoint: forceNewPLP || shouldUseNewPLPEndpoint,
    }
  } catch (error) {
    ctx.vtex.logger.error({
      message: 'Error fetching app settings',
      error: error.message,
    })

    return {
      shouldUseNewPDPEndpoint: forceNewPDP,
      shouldUseNewPLPEndpoint: forceNewPLP,
    }
  }
}
