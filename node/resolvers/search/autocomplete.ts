import { path, split } from 'ramda'

/**
 * It will extract the slug from the HREF in the item
 * passed as parameter.
 *
 * That is needed once the API provide only the old link
 * (from CMS portal) to access the product page, nothing
 * more.
 *
 * HREF provided:
 * https://portal.vtexcommercestable.com.br/:slug/p
 *
 * @param item The item to extract the information
 */
const extractSlug = (item: SearchAutocompleteUnit) => {
  const href = split('/', item.href)
  return item.criteria ? `${href[3]}/${href[4]}` : href[3]
}

const extractThumb = (item: SearchItem) => {
  const imageId = `${item.images[0].imageId}-25-25`
  const imagePaths = item.images[0].imageUrl.split(`/${item.images[0].imageId}/`)
  return `<img src="${imagePaths[0]}/${imageId}/${imagePaths[1]}" width="25" height="25" alt="${imagePaths[1].split('.')[0]}" id="" />`
}

export const resolvers = {
  Items: {
    slug: (root: any) => root.linkText ?? extractSlug(root),

    productId: ({ items, productId }: any) => {
      if (productId) {
        return productId
      }
      return items ? path([0, 'productId'], items) : null
    },

    name: (root: any) => root.name ?? "",

    href: (root: any) => root.href ?? `https://portal.vtexcommercestable.com.br/${root.linkText}/p`,

    thumb: (root: any) => root.items.length ? extractThumb(root.items[0] as SearchItem) : root.thumb,
  },
}
