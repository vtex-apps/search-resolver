import {
  formatTranslatableStringV2,
  parseTranslatableStringV2,
  createMessagesLoader,
} from '@vtex/api'

export const formatTranslatableProp = <R, P extends keyof R, I extends keyof R>(prop: P, idProp: I) =>
  (root: R, _: unknown, ctx: Context) => addContextToTranslatableString(
    {
      content: root[prop] as unknown as string,
      context: root[idProp] as unknown as string
    },
    ctx
  )

interface BaseMessage {
  content: string
  from?: string
}

interface MessageWithContext extends BaseMessage {
  context: string | number
}

export interface Message extends BaseMessage {
  context?: string
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

  const context = (originalContext || message.context)?.toString()
  const from = originalFrom || message.from || locale

  return formatTranslatableStringV2({ content, context, from })
}

export const translateToCurrentLanguage = (message: MessageWithContext, ctx: Context) => {
  const { state, clients, vtex: { binding, tenant, locale } } = ctx
  if (!state.messagesBindingLanguage) {
    state.messagesBindingLanguage = createMessagesLoader(clients, locale ?? binding!.locale)
  }

  return state.messagesBindingLanguage!.load({
    content: message.content,
    context: message.context?.toString(),
    from: message.from ?? tenant!.locale,
  })
}

export const translateManyToCurrentLanguage = (messages: Message[], ctx: Context) => {
  const { state, clients, vtex: { binding, tenant, locale } } = ctx
  if (!state.messagesBindingLanguage) {
    state.messagesBindingLanguage = createMessagesLoader(clients, locale ?? binding!.locale)
  }

  return state.messagesBindingLanguage!.loadMany(messages.map(message => ({
    content: message.content,
    context: message.context,
    from: message.from ?? tenant!.locale,
  })))
}

export const shouldTranslateToUserLocale = ({ vtex: { tenant, locale } }: Context) => tenant?.locale !== locale

export const shouldTranslateToBinding = ({ vtex: { binding, tenant } }: Context) =>
  Boolean(tenant?.locale && binding?.locale && tenant.locale !== binding.locale)

  export const shouldTranslateToTenantLocale = ({ vtex: { locale, tenant } }: Context) =>
  Boolean(tenant?.locale && locale && tenant.locale !== locale)
