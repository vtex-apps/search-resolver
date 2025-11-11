import { find, head, map, replace, slice } from 'ramda'

import {
  formatTranslatableProp,
  addContextToTranslatableString,
} from '../../utils/i18n'

type Attachment = {
  id: number
  name: string
  required: boolean
  domainValues: DomainValue[]
}

type DomainValue = {
  FieldName: string
  MaxCaracters: string
  DomainValues: string
}

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

    attachments: ({ attachments = [] }: SearchItem) => {
      const attachmentsResults: Attachment[] = []

      attachments.forEach((attachment) => {
        // Response from Portal Search
        if (typeof attachment.domainValues === 'string') {
          attachmentsResults.push({
            ...attachment,
            domainValues: JSON.parse(attachment.domainValues) as DomainValue[],
          })
        }

        // Response from IS API
        if (attachment.fields) {
          attachmentsResults.push({
            ...attachment,
            domainValues: attachment.fields.map((field) => ({
              FieldName: field.fieldName,
              MaxCaracters: field.maxCharacters,
              DomainValues: field.domainValues,
            })),
          })
        }
      })

      return attachmentsResults
    },

    images: ({ images = [] }: SearchItem, { quantity }: { quantity: number }) =>
      map(
        (image) => ({
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
        : kitItems.map(async (kitItem) => {
            const products = await search.productBySku(kitItem.itemId)
            const { items: skus = [], ...product } = head(products) || {}
            const sku = find(({ itemId }) => itemId === kitItem.itemId, skus)

            return { ...kitItem, product, sku }
          }),

    variations: (sku: SearchItemExtended, _: any, ctx: Context) => {
      if (!sku) {
        return sku
      }

      const variations = (sku.variations || []).map((variationObj) => {
        const variationName =
          typeof variationObj === 'string'
            ? variationObj
            : (variationObj as { name: string }).name

        const fieldId = (sku.skuSpecifications || []).find(
          (specification) => specification.field.name === variationName
        )?.field?.id

        const variationsValues = (sku as any)[variationName] as string[]

        return {
          name: addContextToTranslatableString(
            { content: variationName, context: fieldId },
            ctx
          ),
          values: variationsValues.map((value) =>
            addContextToTranslatableString(
              { content: value, context: fieldId },
              ctx
            )
          ),
        }
      })

      return variations
    },

    videos: ({ Videos, videos }: SearchItem) => {
      const sanitizedVideo = Videos ?? videos

      const formattedVideo = sanitizedVideo.map((video: string) => ({
        videoUrl: video,
      }))

      return formattedVideo
    },
  },
}
