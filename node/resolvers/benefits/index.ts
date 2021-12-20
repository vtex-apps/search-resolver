import { flatten, indexOf, path } from 'ramda'

const SKU_SEPARATOR = ','
const CATALOG = 'Catalog'
const DEFAULT_SELLER = '1'
const DEFAULT_QUANTITY = 1

export const fieldResolvers = {
  Benefit: {
    items: async (benefit: any, _: any, { clients: { search } }: Context) => {
      const { teaserType, conditions, effects } = benefit

      if (teaserType === CATALOG) {
        const {
          parameters: conditionsParameters,
          minimumQuantity = DEFAULT_QUANTITY,
        } = conditions

        const { parameters: effectsParameters } = effects

        const items = await Promise.all(
          conditionsParameters.map(
            async (conditionsParameter: any, index: any) => {
              const skuIds: string[] = conditionsParameter.value.split(
                SKU_SEPARATOR
              )

              const discount = effectsParameters[index].value
              const products = await search.productsBySku(skuIds)

              return products.map((product: any) => {
                const benefitSKUIds: any = []

                product.items.map((item: any) => {
                  if (indexOf(item.itemId, skuIds) > -1) {
                    benefitSKUIds.push(item.itemId)
                  }
                })

                return {
                  benefitProduct: product,
                  benefitSKUIds,
                  discount,
                  minQuantity: minimumQuantity,
                }
              })
            }
          )
        )

        return flatten(items)
      }

      return
    },
  },
}

export const getBenefits = async (
  itemId: string,
  { clients: { checkout } }: Context
): Promise<unknown[]> => {
  const requestBody = {
    items: [
      {
        id: itemId,
        quantity: DEFAULT_QUANTITY,
        seller: DEFAULT_SELLER,
      },
    ],
  }

  const benefitsData = await checkout.simulation(requestBody)

  return path(['ratesAndBenefitsData', 'teaser'], benefitsData) ?? []
}
