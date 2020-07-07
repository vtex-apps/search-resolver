import { addContextToTranslatableString } from '../../utils/i18n'

export const resolvers = {
  SKUSpecificationField: {
    name: ( field: SKUSpecificationField, _: any, ctx: Context) => {
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