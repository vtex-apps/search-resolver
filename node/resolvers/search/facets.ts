export const resolvers = {
  Facet: {
    values: (facet: Facet, args: FacetValuesArgs) => {
      const { values } = facet
      return values.slice(args.from ?? 0, args.to)
    },
    quantity: (facet: Facet) => {
      return facet.values.length ?? 0
    }
  },
}
