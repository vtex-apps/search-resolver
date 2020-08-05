export const resolvers = {
  SKUSpecificationValue: {
    originalName: (value: SKUSpecificationValue) => {
      return value.name
    },
    name: (value: SKUSpecificationValue) => {
      return value.name
    }
  }
}
