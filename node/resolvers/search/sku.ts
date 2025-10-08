import { find, head, map, replace, slice } from 'ramda'
import { createTranslatableString, formatTranslatableProp } from '../../utils/i18n'

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
    ) =>
      map(
        image => ({
          cacheId: image.imageId,
          ...image,
          imageUrl: replace('http://', 'https://', image.imageUrl),
        }),
        quantity > 0 ? slice(0, quantity, images) : images
      ),

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
      const variations = (sku.variations || []).map(variationObj => {
        const variationName = typeof variationObj === 'string' ? variationObj : (variationObj as {name: string}).name
        const fieldId = (sku.skuSpecifications || []).find(specification => specification.field.name === variationName)?.field?.id
        const variationsValues = (sku as any)[variationName] as string[]
        return {
          name: createTranslatableString({ content: variationName, context: fieldId }, ctx),
          values: variationsValues.map(value => createTranslatableString({ content: value, context: fieldId }, ctx))
        }
      })
      return variations
    },

    videos: ({ Videos, videos }: SearchItem) => {
      let sanitizedVideo = Videos ? Videos : videos

      const formattedVideo = sanitizedVideo.map(
        (video: string) => ({
          videoUrl: video
        })
      )

      return formattedVideo
    }
  },
}
