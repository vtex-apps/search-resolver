import { addContextToTranslatableString } from '../../utils/i18n'

export const resolvers = {
  SKUSpecificationValue: {
    originalName: (value: SKUSpecificationValue) => {
      return value.name
    },
    name: (value: SKUSpecificationValue, _: any, ctx: Context) => {
      return addContextToTranslatableString(
        {
          content: value.name,
          context: value.fieldId
        },
        ctx
      )
    }
  }
}
