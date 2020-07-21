export const resolvers = {
  SKUSpecificationField: {
    originalName: (value: SKUSpecificationField) => {
      return value.name
    },
    name: (value: SKUSpecificationField) => {
      return value.name
    }
  }
}
