import { propOr } from 'ramda'

const InstallmentsCriteria = {
  ALL: 'ALL',
  MAX: 'MAX',
  MIN: 'MIN',
  MAX_WITHOUT_INTEREST: 'MAX_WITHOUT_INTEREST',
  MAX_WITH_INTEREST: 'MAX_WITH_INTEREST',
}

const gte = (a: number, b: number) => a > b
const lte = (a: number, b: number) => a < b

const includesCaseInsensitive = (list: string[], item: string) => {
  const normalizedList = list.map(j => String(j).toUpperCase())

  return normalizedList.indexOf(String(item).toUpperCase()) > -1
}


export const resolvers = {
  Offer: {
    Installments: (
      { Installments }: CommertialOffer,
      {
        criteria,
        rates,
        excludedPaymentSystems,
        includedPaymentSystems,
      } : {
        criteria?: string
        rates?: boolean
        excludedPaymentSystems?: string[]
        includedPaymentSystems?: string[]
      }
    ) => {
      if (criteria === InstallmentsCriteria.ALL || Installments.length === 0) {
        return Installments
      }

      /** TODO: Transforms arguments for backwards-compatibility. Should be cleaned up in the future */
      if (criteria === InstallmentsCriteria.MAX_WITH_INTEREST || criteria === InstallmentsCriteria.MAX_WITHOUT_INTEREST){
        rates = criteria === InstallmentsCriteria.MAX_WITHOUT_INTEREST
        criteria = InstallmentsCriteria.MAX
      }

      let filteredInstallments = !rates
        ? Installments
        : Installments.filter(({ InterestRate }) => !InterestRate)

      if (includedPaymentSystems) {
        filteredInstallments = filteredInstallments.filter(
          ({ PaymentSystemName }) =>
            includesCaseInsensitive(includedPaymentSystems, PaymentSystemName)
        )
      }

      if (excludedPaymentSystems) {
        filteredInstallments = filteredInstallments.filter(
          ({ PaymentSystemName }) =>
            (includesCaseInsensitive(excludedPaymentSystems, PaymentSystemName) === false))
      }

      const compareFunc = criteria === InstallmentsCriteria.MAX ? gte : lte
      const value = filteredInstallments.reduce(
        (acc, currentValue) =>
          compareFunc(
            currentValue.NumberOfInstallments,
            acc.NumberOfInstallments
          )
            ? currentValue
            : acc,
        filteredInstallments[0]
      )
      return [value]
    },
    teasers: (offer: CommertialOffer) => {
      return offer.teasers ?? offer.Teasers ?? []
    },
    giftSkuIds: propOr([], 'GiftSkuIds'),
    gifts: async ({ GiftSkuIds }: CommertialOffer, _: any, ctx: Context) => {
      if (!GiftSkuIds || GiftSkuIds.length === 0) {
        return []
      }

      const catalogGiftProducts = await ctx.clients.search.productsBySku(GiftSkuIds).catch(() => null)

      if (!catalogGiftProducts || catalogGiftProducts.length === 0) {
        return []
      }

      const giftProducts = GiftSkuIds.map(skuId => {
        let giftSku = null
        let giftProduct = null

        for (const currGiftProduct of catalogGiftProducts) {
          const currGiftSku = currGiftProduct.items.find(item => item.itemId === skuId)
          if (currGiftSku) {
            giftSku = currGiftSku
            giftProduct = currGiftProduct
            break
          }
        }
        if (!giftProduct || !giftSku) {
          return null
        }
        const {
          productName,
          brand,
          linkText,
          description,
        } = giftProduct
        return {
          productName,
          brand,
          linkText,
          description,
          skuName: giftSku?.nameComplete ?? '',
          images: giftSku?.images.map(({ imageLabel, imageUrl, imageText }) => ({
            imageUrl,
            imageLabel,
            imageText,
          })) ?? [],
        }
      })
      const filteredGiftProducts = giftProducts.filter(Boolean)

      return filteredGiftProducts
    },
    discountHighlights: (offer: CommertialOffer) => {
      return offer.DiscountHighLight || offer.discountHighlights || []
    },
    spotPrice: (offer: CommertialOffer) => {
      if (offer.spotPrice) {
        return offer.spotPrice
      }
      const sellingPrice = offer.Price
      const spotPrice: number | undefined = offer.Installments.find(({NumberOfInstallments, Value}) => {
        return (NumberOfInstallments === 1 && Value < sellingPrice)
      })?.Value;
      return spotPrice || sellingPrice
    },
    taxPercentage: (offer: CommertialOffer) => {
      if (!offer.Price) {
        return 0
      }

      return offer.Tax / offer.Price
    }
  },
}
