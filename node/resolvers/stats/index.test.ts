import { queries } from './index'

describe('searchURLsCount', () => {
  it('returns an empty array now that VBase has been removed', async () => {
    const result = await queries.searchURLsCount(null, { limit: 10 }, {} as any)

    expect(result).toStrictEqual([])
  })
})
