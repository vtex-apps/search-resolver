type AppSettings = {
  shouldUseNewPDPEndpoint: boolean
  shouldUseNewPLPEndpoint: boolean
}

export async function fetchAppSettings(ctx: Context): Promise<AppSettings> {
  const {
    clients: { apps },
  } = ctx

  try {
    const { shouldUseNewPDPEndpoint, shouldUseNewPLPEndpoint }: AppSettings =
      await apps.getAppSettings('vtex.search-resolver@1.x')

    return {
      shouldUseNewPDPEndpoint,
      shouldUseNewPLPEndpoint,
    }
  } catch (error) {
    ctx.vtex.logger.error({
      message: 'Error fetching app settings',
      error: error.message,
    })

    return {
      shouldUseNewPDPEndpoint: false,
      shouldUseNewPLPEndpoint: false,
    }
  }
}
