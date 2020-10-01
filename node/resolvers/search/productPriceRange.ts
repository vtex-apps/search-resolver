interface Root {
  offers: CommertialOffer[]
}

const getMaxAndMinForAttribute = (
  offers: CommertialOffer[],
  attribute: 'Price' | 'ListPrice'
) => {
  return offers.reduce(
    (acc, currentOffer) => {
      const highPrice =
        currentOffer[attribute] > acc.highPrice
          ? currentOffer[attribute]
          : acc.highPrice
      const lowPrice =
        currentOffer[attribute] < acc.lowPrice && currentOffer[attribute] !== 0
          ? currentOffer[attribute]
          : acc.lowPrice
      return { highPrice, lowPrice }
    },
    { highPrice: 0, lowPrice: Infinity }
  )
}

export const resolvers = {
  ProductPriceRange: {
    sellingPrice: ({ offers }: Root) => {
      return getMaxAndMinForAttribute(offers, 'Price')
    },
    listPrice: ({ offers }: Root) => {
      return getMaxAndMinForAttribute(offers, 'ListPrice')
    },
  },
  PriceRange: {
    lowPrice: ({ lowPrice }: any) => lowPrice !== Infinity ? lowPrice : null
  }
}
