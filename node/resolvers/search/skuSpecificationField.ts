import { addContextToTranslatableString } from '../../utils/i18n'

// if it has `originalName`, the specification is already coming from the API in the appropriate format and language
export const resolvers = {
  SKUSpecificationField: {
    originalName: (value: SKUSpecificationField) => {
      return value.originalName ? value.originalName : value.name
    },
    name: (field: SKUSpecificationField, _: any, ctx: Context) => {
      return field.originalName ? field.name : addContextToTranslatableString(
        {
          content: field.name,
          context: field.id
        },
        ctx
      )
    }
  }
}
