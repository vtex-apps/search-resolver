import { clone } from 'ramda'

import { resolvers } from './product'
import { resolvers as productPriceResolvers } from './productPriceRange'
import { mockContext } from '../../__mocks__/helpers'
import { productPriceRange } from '../../__mocks__/productPriceRange'

describe('tests related to ProductPriceRange type', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockContext.vtex.platform = 'vtex'
  })

  test('gets correct value for product with many skus and prices', () => {
    const { offers } = resolvers.Product.priceRange(
      productPriceRange as any
    ) as { offers: CommertialOffer[] }

    const sellingPrice = productPriceResolvers.ProductPriceRange.sellingPrice({
      offers,
    })

    expect(sellingPrice).toMatchObject({ highPrice: 100, lowPrice: 20 })

    const listPrice = productPriceResolvers.ProductPriceRange.listPrice({
      offers,
    })

    expect(listPrice).toMatchObject({ highPrice: 150, lowPrice: 30 })
  })
  test('works for products with many sellers', () => {
    const cloneProduct = clone(productPriceRange)

    cloneProduct.items[0].sellers.push({
      sellerId: '99',
      commertialOffer: {
        Price: 10,
        ListPrice: 160,
        AvailableQuantity: 10,
      },
    } as any)

    const { offers } = resolvers.Product.priceRange(cloneProduct as any) as {
      offers: CommertialOffer[]
    }

    const sellingPrice = productPriceResolvers.ProductPriceRange.sellingPrice({
      offers,
    })

    expect(sellingPrice).toMatchObject({ highPrice: 100, lowPrice: 10 })

    const listPrice = productPriceResolvers.ProductPriceRange.listPrice({
      offers,
    })

    expect(listPrice).toMatchObject({ highPrice: 160, lowPrice: 30 })
  })

  test('ignores sellers with no availability', () => {
    const cloneProduct = clone(productPriceRange)

    cloneProduct.items[0].sellers.push({
      sellerId: '99',
      commertialOffer: {
        Price: 10,
        ListPrice: 10,
        AvailableQuantity: 0,
      },
    } as any)

    const { offers } = resolvers.Product.priceRange(cloneProduct as any) as {
      offers: CommertialOffer[]
    }

    const sellingPrice = productPriceResolvers.ProductPriceRange.sellingPrice({
      offers,
    })

    expect(sellingPrice).toMatchObject({ highPrice: 100, lowPrice: 20 })

    const listPrice = productPriceResolvers.ProductPriceRange.listPrice({
      offers,
    })

    expect(listPrice).toMatchObject({ highPrice: 150, lowPrice: 30 })
  })
})
