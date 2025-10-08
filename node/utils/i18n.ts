import {
  createMessagesLoader,
  formatTranslatableStringV2,
  parseTranslatableStringV2,
} from '@vtex/api'
import { logDegradedSearchError } from '../resolvers/search/utils'

export const formatTranslatableProp = <R, P extends keyof R, I extends keyof R>(prop: P, idProp: I) =>
  (root: R, _: unknown, ctx: Context) => addContextToTranslatableString(
    {
      content: root[prop] as unknown as string,
      context: root[idProp] as unknown as string
    },
    ctx
  )

export const formatTranslatablePropWithTranslatedFlag = <R, P extends keyof R, I extends keyof R>(prop: P, idProp: I) =>
  (root: R, _: unknown, ctx: Context) => addContextToTranslatableStringWithTranslatedFlag(
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

export const addContextToTranslatableString = (message: Message, ctx: Context, includeState: boolean = false) => {
  const { vtex: { tenant } } = ctx
  const { locale } = tenant!

  if (!message.content) {
    return message.content
  }


  try {
    const {
      content,
      context: originalContext,
      from: originalFrom
    } = parseTranslatableStringV2(message.content)

    const context = (originalContext || message.context)?.toString()
    const from = originalFrom || message.from || locale
    const formatParams: any = { content, context, from }

    if (includeState) {
      formatParams.state = 'translated'
    }

    return formatTranslatableStringV2(formatParams)
  } catch (e) {
    logDegradedSearchError(ctx.vtex.logger, {
      service: 'node-vtex-api translation',
      error: 'Error when trying to add context to translatable string',
      errorStack: e,
    })
    return message.content
  }
}

export const addContextToTranslatableStringWithTranslatedFlag = (message: Message, ctx: Context) => {
  return addContextToTranslatableString(message, ctx, true)
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

export const shouldTranslateToBinding = ({ translated, vtex: { binding, tenant } }: Context, ignoreIndexedTranslation?: boolean) =>
  binding && binding?.locale !== tenant?.locale && (!translated || ignoreIndexedTranslation)

export const shouldTranslateToTenantLocale = ({ vtex: { locale, tenant } }: Context) =>
  Boolean(tenant?.locale && locale && tenant.locale !== locale)
