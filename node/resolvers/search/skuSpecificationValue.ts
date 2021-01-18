import { addContextToTranslatableString } from '../../utils/i18n'

// if it has `originalName`, the specification is already coming in the appropriate format and language
export const resolvers = {
  SKUSpecificationValue: {
    originalName: (value: SKUSpecificationValue) => {
      return  value.originalName ? value.originalName : value.name
    },
    name: (value: SKUSpecificationValue, _: any, ctx: Context) => {
      return value.originalName ? value.name : addContextToTranslatableString(
        {
          content: value.name,
          context: value.fieldId
        },
        ctx
      )
    }
  }
}
