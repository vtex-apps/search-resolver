import { ShadowMigration } from './ShadowMigration'

const mockGetBoolean = jest.fn()

jest.mock('../services/featurehub', () => ({
  createEvaluator: jest.fn(() =>
    Promise.resolve({ getBoolean: mockGetBoolean })
  ),
}))

function createCtx(account = 'test') {
  return {
    vtex: {
      account,
      logger: { warn: jest.fn(), info: jest.fn(), error: jest.fn() },
    },
  } as unknown as Context
}

describe('ShadowMigration', () => {
  const migration = new ShadowMigration<number>({
    name: 'test',
    normalize: (x) => x,
    flags: {
      migrationComplete: 'complete',
      shadow: 'shadow',
      returnNew: 'returnNew',
    },
  })

  const legacy = jest.fn().mockResolvedValue(1)
  const next = jest.fn().mockResolvedValue(2)

  beforeEach(() => {
    jest.clearAllMocks()
    mockGetBoolean.mockResolvedValue(false)
  })

  it('when migrationComplete=true calls only next() and returns new', async () => {
    mockGetBoolean
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(false)

    const ctx = createCtx()
    const { result, source } = await migration.execute(legacy, next, ctx)

    expect(result).toBe(2)
    expect(source).toBe('new')
    expect(next).toHaveBeenCalledTimes(1)
    expect(legacy).not.toHaveBeenCalled()
  })

  it('when shadow=false calls only legacy() and returns legacy', async () => {
    const ctx = createCtx()
    const { result, source } = await migration.execute(legacy, next, ctx)

    expect(result).toBe(1)
    expect(source).toBe('legacy')
    expect(legacy).toHaveBeenCalledTimes(1)
    expect(next).not.toHaveBeenCalled()
  })

  it('when shadow=true returnNew=false calls both, returns legacy', async () => {
    mockGetBoolean
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false)

    const ctx = createCtx()
    const { result, source } = await migration.execute(legacy, next, ctx)

    expect(result).toBe(1)
    expect(source).toBe('legacy')
    expect(legacy).toHaveBeenCalledTimes(1)
    expect(next).toHaveBeenCalledTimes(1)
  })

  it('when shadow=true returnNew=true calls both, returns new', async () => {
    mockGetBoolean
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(true)

    const ctx = createCtx()
    const { result, source } = await migration.execute(legacy, next, ctx)

    expect(result).toBe(2)
    expect(source).toBe('new')
    expect(legacy).toHaveBeenCalledTimes(1)
    expect(next).toHaveBeenCalledTimes(1)
  })

  it('on flag evaluation error falls back to legacy only', async () => {
    mockGetBoolean.mockRejectedValue(new Error('fh down'))

    const ctx = createCtx()
    const { result, source } = await migration.execute(legacy, next, ctx)

    expect(result).toBe(1)
    expect(source).toBe('legacy')
    expect(legacy).toHaveBeenCalledTimes(1)
    expect(next).not.toHaveBeenCalled()
  })

  it('when shadow=true logs structural differences when legacy and new differ', async () => {
    mockGetBoolean
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false)

    const legacyFn = jest.fn().mockResolvedValue({ a: 1, b: 2 })
    const nextFn = jest.fn().mockResolvedValue({ a: 1 })

    const migrationWithNormalize = new ShadowMigration<Record<string, number>>({
      name: 'diff-test',
      normalize: (x) => x,
      flags: {
        migrationComplete: 'complete',
        shadow: 'shadow',
        returnNew: 'returnNew',
      },
    })

    const ctx = createCtx()

    await migrationWithNormalize.execute(legacyFn, nextFn, ctx)
    await new Promise<void>((resolve) => {
      setImmediate(() => resolve())
    })

    expect(ctx.vtex.logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'ShadowMigration diff-test structural differences',
        name: 'diff-test',
        diffCount: 1,
        diffSummary: expect.any(Array),
        differences: expect.any(Array),
      })
    )
  })

  it('when shadow=true logs compare failed when normalize throws', async () => {
    mockGetBoolean
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false)

    const legacyFn = jest.fn().mockResolvedValue(1)
    const nextFn = jest.fn().mockResolvedValue(2)

    const migrationThrowing = new ShadowMigration<number>({
      name: 'throw-test',
      normalize: () => {
        throw new Error('normalize boom')
      },
      flags: {
        migrationComplete: 'complete',
        shadow: 'shadow',
        returnNew: 'returnNew',
      },
    })

    const ctx = createCtx()

    await migrationThrowing.execute(legacyFn, nextFn, ctx)
    await new Promise<void>((resolve) => {
      setImmediate(() => resolve())
    })

    expect(ctx.vtex.logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'ShadowMigration throw-test compare failed',
        name: 'throw-test',
        error: 'normalize boom',
      })
    )
  })
})
