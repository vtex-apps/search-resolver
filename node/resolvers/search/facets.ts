export const resolvers = {
  Facet: {
    values: (facet: any, args: any) => {
      const { values } = facet
      return values.slice(args.from ?? 0, args.to)
    },
    quantity: (facet: any) => {
      return facet.values.length ?? 0
    }
  },
}
