export const resolvers = {
  Facet: {
    values: (facet: any, args: any) => {
      const { values } = facet
      if (args.from === undefined) {
        return values
      } else {
        return values.slice(args.from ?? 0, args.to)
      }
    },
    quantity: (facet: any) => {
      return facet.values.length || 0
    }
  },
}