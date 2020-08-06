import { addContextToTranslatableString } from '../../utils/i18n'

export const resolvers = {
  SKUSpecificationField: {
    originalName: (value: SKUSpecificationField) => {
      return value.name
    },
    name: (field: SKUSpecificationField, _: any, ctx: Context) => {
      return addContextToTranslatableString(
        {
          content: field.name,
          context: field.id
        },
        ctx
      )
    }
  }
}
