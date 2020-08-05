import { find, head, map, replace, slice } from 'ramda'

export const resolvers = {
  SKU: {
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
            const products = await search.productBySku([kitItem.itemId])
            const { items: skus = [], ...product } = head(products) || {}
            const sku = find(({ itemId }) => itemId === kitItem.itemId, skus)
            return { ...kitItem, product, sku }
          }),

    variations: (sku: SearchItem) =>
      sku &&
      map(
        (name: string) => ({ name, values: (sku as any)[name] }),
        sku.variations || []
      ),

    videos: ({ Videos }: SearchItem) =>
      map(
        (video: string) => ({
          videoUrl: video,
        }),
        Videos
      ),
  },
}
