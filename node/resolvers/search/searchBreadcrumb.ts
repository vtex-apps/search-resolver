import { APP_NAME } from './constants'
import { Slugify } from '../../utils/slug'

export const resolvers = {
  SearchBreadcrumb: {
    href: async ({ href }: { href: string }, _: unknown, ctx: Context) => {
      const settings: AppSettings = await ctx.clients.apps.getAppSettings(APP_NAME)

      return settings.slugifyLinks ? Slugify(href) : href
    },
  },
}
