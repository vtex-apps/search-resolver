import { resolvers } from './category'

describe('Category resolvers', () => {
  const category = {
    id: 10,
    name: 'Shoes',
    Title: 'Shoes Title',
    MetaTagDescription: 'Shoes meta',
  }

  it('returns catalog name, title and meta without Messages wrapping', () => {
    expect(resolvers.Category.name(category)).toBe('Shoes')
    expect(resolvers.Category.titleTag(category)).toBe('Shoes Title')
    expect(resolvers.Category.metaTagDescription(category)).toBe('Shoes meta')
  })
})
