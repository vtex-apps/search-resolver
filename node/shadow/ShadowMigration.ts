import { createEvaluator } from '../services/featurehub'
import { structuralCompare } from './structuralCompare'

export interface ShadowMigrationConfig<T> {
  /** Synchronous; projects data to a comparable shape for structural diff. */
  normalize: (data: T) => unknown
  name: string
  flags: {
    migrationComplete: string
    shadow: string
    returnNew: string
  }
}

export interface ExecuteResult<T> {
  result: T
  source: 'legacy' | 'new'
}

export class ShadowMigration<T> {
  constructor(private config: ShadowMigrationConfig<T>) {}

  public async execute(
    legacy: () => Promise<T>,
    next: () => Promise<T>,
    ctx: Context
  ): Promise<ExecuteResult<T>> {
    const account = ctx.vtex?.account ?? ''

    let migrationComplete = false
    let shadow = false
    let returnNew = false

    try {
      const evaluator = await createEvaluator(account)
      const {
        migrationComplete: migrationCompleteKey,
        shadow: shadowKey,
        returnNew: returnNewKey,
      } = this.config.flags

      ;[migrationComplete, shadow, returnNew] = await Promise.all([
        evaluator.getBoolean(migrationCompleteKey, false),
        evaluator.getBoolean(shadowKey, false),
        evaluator.getBoolean(returnNewKey, false),
      ])
    } catch {
      // Fallback: all false -> legacy only
    }

    if (migrationComplete) {
      const result = await next()

      return { result, source: 'new' }
    }

    if (!shadow) {
      const result = await legacy()

      return { result, source: 'legacy' }
    }

    const [legacyResult, newResult] = await Promise.all([legacy(), next()])

    this.scheduleCompare(legacyResult, newResult, ctx)

    if (returnNew) {
      return { result: newResult, source: 'new' }
    }

    return { result: legacyResult, source: 'legacy' }
  }

  private scheduleCompare(legacyData: T, newData: T, ctx: Context): void {
    Promise.resolve()
      .then(() => {
        const normLegacy = this.config.normalize(legacyData)
        const normNew = this.config.normalize(newData)
        const { diffs, summary } = structuralCompare(normLegacy, normNew)

        if (diffs.length > 0) {
          ctx.vtex?.logger?.warn?.({
            message: `ShadowMigration ${this.config.name} structural differences`,
            name: this.config.name,
            diffCount: diffs.length,
            diffSummary: summary,
            differences: diffs.slice(0, 20),
          })
        }
      })
      .catch((err) => {
        ctx.vtex?.logger?.warn?.({
          message: `ShadowMigration ${this.config.name} compare failed`,
          name: this.config.name,
          error: err instanceof Error ? err.message : String(err),
        })
      })
  }
}
