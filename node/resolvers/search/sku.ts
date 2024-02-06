import { find, head, map } from 'ramda'
import {
  formatTranslatableProp,
  addContextToTranslatableString,
} from '../../utils/i18n'

export const resolvers = {
  SKU: {
    name: formatTranslatableProp<SearchItem, 'name', 'itemId'>(
      'name',
      'itemId'
    ),

    nameComplete: formatTranslatableProp<SearchItem, 'nameComplete', 'itemId'>(
      'nameComplete',
      'itemId'
    ),

    attachments: ({ attachments = [] }: SearchItem) =>
      map(
        (attachment: any) => ({
          ...attachment,
          domainValues: JSON.parse(attachment.domainValues),
        }),
        attachments
      ),

    images: (
      { images = [] }: SearchItem,
      { quantity }: { quantity: number }
    ) => {
      const someImages = quantity > 0 ? images.slice(0, quantity) : images

      return someImages.map(image => {
        return {
          cacheId: image.imageId,
          ...image,
          imageUrl: image.imageUrl
            ? image.imageUrl.replace('http://', 'https://')
            : '',
        }
      })
    },

    kitItems: (
      { kitItems }: SearchItem,
      _: any,
      { clients: { search } }: Context
    ) =>
      !kitItems
        ? []
        : kitItems.map(async kitItem => {
            const products = await search.productBySku(kitItem.itemId)
            const { items: skus = [], ...product } = head(products) || {}
            const sku = find(({ itemId }) => itemId === kitItem.itemId, skus)
            return { ...kitItem, product, sku }
          }),

    variations: (sku: SearchItemExtended, _: any, ctx: Context) => {
      if (!sku) {
        return sku
      }
      const variations = (sku.variations || []).map(variationName => {
        const fieldId = (sku.skuSpecifications || []).find(
          specification => specification.field.name === variationName
        )?.field?.id
        const variationsValues = (sku as any)[variationName] as string[]
        return {
          name: addContextToTranslatableString(
            { content: variationName, context: fieldId },
            ctx
          ),
          values: variationsValues.map(value =>
            addContextToTranslatableString(
              { content: value, context: fieldId },
              ctx
            )
          ),
        }
      })
      return variations
    },

    videos: ({ Videos }: SearchItem) =>
      map(
        (video: string) => ({
          videoUrl: video,
        }),
        Videos
      ),
  },
}
