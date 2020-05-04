import {
  formatTranslatableStringV2,
  parseTranslatableStringV2,
} from '@vtex/api'

export const formatTranslatableProp = <R, P extends keyof R, I extends keyof R>(prop: P, idProp: I) =>
  (root: R, _: unknown, ctx: Context) => addContextToTranslatableString(
    {
      content: root[prop] as unknown as string,
      context: root[idProp] as unknown as string
    },
    ctx
  )

interface Message {
  content: string,
  context: string,
  from?: string
}

export const addContextToTranslatableString = (message: Message, ctx: Context) => {
  const { vtex: { tenant } } = ctx
  const { locale } = tenant!

  if (!message.content) {
    return message.content
  }

  const {
    content,
    context: originalContext,
    from: originalFrom
  } = parseTranslatableStringV2(message.content)

  const context = originalContext || message.context
  const from = originalFrom || message.from || locale

  return formatTranslatableStringV2({content, context, from})
}
