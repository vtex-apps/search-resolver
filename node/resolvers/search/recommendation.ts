import { SearchCrossSellingTypes } from './utils'

type SimilarProductsQuantityEnum = 'ALL_AVAILABLE' | 'DEFAULT'

export const resolvers = {
  Recommendation: {
    buy: (
      { productId }: SearchProduct,
      _: any,
      { clients: { search } }: Context
    ) =>
      search.crossSelling(
        productId,
        SearchCrossSellingTypes.whoboughtalsobought
      ),

    similars: (
      { productId }: SearchProduct,
      { quantity = 'DEFAULT' }: { quantity: SimilarProductsQuantityEnum },
      { clients: { search } }: Context
    ) => {
      // Let's keep this variable name explicit
      const groupByProduct = quantity !== 'ALL_AVAILABLE';

      return search.crossSelling(productId, SearchCrossSellingTypes.similars, groupByProduct)
    },

    view: (
      { productId }: SearchProduct,
      _: any,
      { clients: { search } }: Context
    ) =>
      search.crossSelling(productId, SearchCrossSellingTypes.whosawalsosaw),
  },
}
