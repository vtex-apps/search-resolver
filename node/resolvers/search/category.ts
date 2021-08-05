import { compose, last, prop, split } from 'ramda'

import { getCategoryInfo } from './utils'
import { formatTranslatableProp, shouldTranslateToBinding } from '../../utils/i18n'
import { Slugify } from '../../utils/slug'
import { APP_NAME } from './constants'

const lastSegment = compose<string, string[], string>(
  last,
  split('/')
)

function cleanUrl(url: string) {
  return url.replace(/https:\/\/[A-z0-9]+\.vtexcommercestable\.com\.br/, '').toLowerCase()
}

/** This type has to be created because the Catlog API to get category by ID does not return the url or children for now.
 * These fields only come if you get the category from the categroy tree api.
 */

type SafeCategory = CategoryByIdResponse | CategoryTreeResponse

export const resolvers = {
  Category: {
    name: formatTranslatableProp<SafeCategory, 'name', 'id'>(
      'name',
      'id'
    ),

    cacheId: prop('id'),

    href: async ({ url, id }: SafeCategory, _: unknown, ctx: Context) => {
      const settings: AppSettings = await ctx.clients.apps.getAppSettings(APP_NAME)

      if (shouldTranslateToBinding(ctx)) {
        const rewriterUrl = await ctx.clients.rewriter.getRoute(id.toString(), 'anyCategoryEntity', ctx.vtex.binding!.id!)
        if (rewriterUrl) {
          url = rewriterUrl
        }
      }
      const pathname = cleanUrl(url)

      return settings.slugifyLinks ? Slugify(pathname) : pathname
    },

    metaTagDescription: formatTranslatableProp<SafeCategory, 'MetaTagDescription', 'id'>(
      'MetaTagDescription',
      'id'
    ),

    titleTag: formatTranslatableProp<SafeCategory, 'Title', 'id'>(
      'Title',
      'id'
    ),

    slug: async ({ url, id }: SafeCategory, _: unknown, ctx: Context) => {
      if (shouldTranslateToBinding(ctx)) {
        const rewriterUrl = await ctx.clients.rewriter.getRoute(id.toString(), 'anyCategoryEntity', ctx.vtex.binding!.id!)
        if (rewriterUrl) {
          url = rewriterUrl
        }
      }
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
