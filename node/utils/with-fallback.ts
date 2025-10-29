/**
 * Helper function to execute intsch as primary with intelligentSearchApi as fallback
 */
export async function withFallback<T>(
    primaryFn: () => Promise<T>,
    fallbackFn: () => Promise<T>,
    logger: any,
    operationName: string,
    args?: Record<string, unknown>
  ): Promise<T> {
    try {
      return await primaryFn()
    } catch (error) {
      logger.warn({
        message: `${operationName}: Primary call failed, using fallback`,
        error: error.message,
        args,
      })
  
      return fallbackFn()
    }
  }