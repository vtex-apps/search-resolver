import { compose, last, prop, split } from 'ramda'

import { getCategoryInfo } from './utils'

const lastSegment = compose<string, string[], string>(
  last,
  split('/')
)

function cleanUrl(url: string) {
  return url.replace(/https:\/\/[A-z0-9]+\.vtexcommercestable\.com\.br/, '')
}

/** This type has to be created because the Catlog API to get category by ID does not return the url or children for now.
 * These fields only come if you get the category from the categroy tree api.
 */

type SafeCategory = CategoryByIdResponse | CategoryTreeResponse

export const resolvers = {
  Category: {
    cacheId: prop('id'),

    href: async ({ url }: SafeCategory) => {
      return cleanUrl(url)
    },

    metaTagDescription: prop('MetaTagDescription'),

    titleTag: prop('Title'),

    slug: async ({ url }: SafeCategory) => {
      return url ? lastSegment(url) : null
    },

    children: async (
      { id, children }: SafeCategory,
      _: any,
      { clients: { search } }: Context
    ) => {
      if (children == null) {
        const category = await getCategoryInfo(search, id, 5)
        children = category.children
      }
      return children
    },
  },
}
