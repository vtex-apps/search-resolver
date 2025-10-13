type AppSettings = {
  shouldUseNewPDPEndpoint: boolean
}

export async function fetchAppSettings(ctx: Context): Promise<AppSettings> {
  const {
    clients: { apps },
  } = ctx

  try {
    const { shouldUseNewPDPEndpoint }: AppSettings = await apps.getAppSettings(
      'vtex.search-resolver@1.x'
    )

    return {
      shouldUseNewPDPEndpoint,
    }
  } catch (error) {
    ctx.vtex.logger.error({
      message: 'Error fetching app settings',
      error: error.message,
    })

    return {
      shouldUseNewPDPEndpoint: false,
    }
  }
}
