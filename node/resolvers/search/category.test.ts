import { mockContext, resetContext } from '../../__mocks__/helpers'
import { resolvers } from './category'

describe('Category resolvers', () => {
  const category = {
    id: 10,
    name: 'Shoes',
    Title: 'Shoes Title',
    MetaTagDescription: 'Shoes meta',
  }

  beforeEach(() => {
    resetContext()
    mockContext.translated = undefined
  })

  it('wraps name, title and meta as translated when ctx.translated is true', () => {
    mockContext.translated = true

    expect(resolvers.Category.name(category as any, {}, mockContext)).toBe(
      'Shoes (((10))) <<<pt-BR>>> [[[translated]]]'
    )
    expect(resolvers.Category.titleTag(category as any, {}, mockContext)).toBe(
      'Shoes Title (((10))) <<<pt-BR>>> [[[translated]]]'
    )
    expect(
      resolvers.Category.metaTagDescription(category as any, {}, mockContext)
    ).toBe('Shoes meta (((10))) <<<pt-BR>>> [[[translated]]]')
  })

  it('wraps name, title and meta as original when ctx.translated is false', () => {
    mockContext.translated = false

    expect(resolvers.Category.name(category as any, {}, mockContext)).toBe(
      'Shoes (((10))) <<<pt-BR>>> [[[original]]]'
    )
    expect(resolvers.Category.titleTag(category as any, {}, mockContext)).toBe(
      'Shoes Title (((10))) <<<pt-BR>>> [[[original]]]'
    )
    expect(
      resolvers.Category.metaTagDescription(category as any, {}, mockContext)
    ).toBe('Shoes meta (((10))) <<<pt-BR>>> [[[original]]]')
  })

  it('keeps catalog context and applies ctx.translated on an already marked string', () => {
    mockContext.translated = true

    expect(
      resolvers.Category.name(
        {
          ...category,
          id: 621,
          name: 'Dermocosmética (((621))) <<<es-CO>>>',
        } as any,
        {},
        mockContext
      )
    ).toBe('Dermocosmética (((621))) <<<es-CO>>> [[[translated]]]')
  })
})
