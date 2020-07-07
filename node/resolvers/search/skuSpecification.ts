export const resolvers = {
  SkuSpecification: {
    values: (skuSpecification: SkuSpecification) => {
      const fieldId = skuSpecification.field.id
      return skuSpecification.values.map(value => ({
        ...value,
        fieldId,
      }))
    },
  },
}
