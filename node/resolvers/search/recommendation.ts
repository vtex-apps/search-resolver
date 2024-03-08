import { GroupByCrossSellingTypes, SearchCrossSellingTypes } from './utils'

interface RecommendationParentProps {
  product: SearchProduct,
  groupBy: string
}

export const resolvers = {
  Recommendation: {
    buy: (
      { product: {productId} , groupBy = GroupByCrossSellingTypes.PRODUCT}: RecommendationParentProps,
      _: any,
      { clients: { search } }: Context
    ) =>
    {
      const groupByProduct = groupBy === GroupByCrossSellingTypes.PRODUCT ? true : false
      return search.crossSelling(productId, SearchCrossSellingTypes.whoboughtalsobought, groupByProduct)
    },

    similars: (
      { product: {productId} , groupBy = GroupByCrossSellingTypes.PRODUCT}: RecommendationParentProps,
      _: any,
      { clients: { search } }: Context
    ) =>
    {
      const groupByProduct = groupBy === GroupByCrossSellingTypes.PRODUCT ? true : false
      return search.crossSelling(productId, SearchCrossSellingTypes.similars, groupByProduct)
    },

    view: (
      { product: {productId} , groupBy = GroupByCrossSellingTypes.PRODUCT}: RecommendationParentProps,
      _: any,
      { clients: { search } }: Context
    ) =>
    {
      const groupByProduct = groupBy === GroupByCrossSellingTypes.PRODUCT ? true : false
      return search.crossSelling(productId, SearchCrossSellingTypes.whosawalsosaw, groupByProduct)
    },
  },
}
