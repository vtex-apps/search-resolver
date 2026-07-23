import { resolvers } from './offer'

describe('tests related to Offer type resolvers', () => {
  describe('priceToken resolver', () => {
    test('returns the token when present on commertialOffer', () => {
      const offer = {
        PriceToken: 'signed-jwt-token',
      } as any

      expect(resolvers.Offer.priceToken(offer)).toBe('signed-jwt-token')
    })

    test('returns null when absent (legacy search client or Pricing Fallback disabled)', () => {
      const offer = {} as any

      expect(resolvers.Offer.priceToken(offer)).toBeNull()
    })
  })
})
