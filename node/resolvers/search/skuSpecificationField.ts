import { addContextToTranslatableStringWithTranslatedFlag } from '../../utils/i18n'

// if it has `originalName`, the specification is already coming in the appropriate format and language
export const resolvers = {
  SKUSpecificationField: {
    originalName: (value: SKUSpecificationField) => {
      return value.originalName ? value.originalName : value.name
    },
    name: (field: SKUSpecificationField, _: any, ctx: Context) => {
      return field.originalName ? field.name : addContextToTranslatableStringWithTranslatedFlag(
        {
          content: field.name,
          context: field.id
        },
        ctx
      )
    }
  }
}
