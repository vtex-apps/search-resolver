import {
  formatTranslatableStringV2
} from '@vtex/api'

export const resolvers = {
  Facet: {
    name: (facet: Facet, _: FacetValuesArgs, ctx: Context) => {
      const { locale, tenant } = ctx.vtex
      const from = locale ?? tenant?.locale
      return formatTranslatableStringV2({
        content: facet.name,
        from,
      })
    },
    values: (facet: Facet, args: FacetValuesArgs, ctx: Context) => {
      const { values } = facet
      const { locale, tenant } = ctx.vtex
      const from = locale ?? tenant?.locale
      return values.slice(args.from ?? 0, args.to).map(value => {
        return {
          ...value,
          name: formatTranslatableStringV2({
            content: value.name,
            from,
          })
        }
      })
    },
    quantity: (facet: Facet) => {
      return facet.values.length ?? 0
    }
  },
}
