import {
  IOContext,
  MetricsAccumulator,
  ParamsContext,
  RecorderState,
  SegmentData,
  ServiceContext,
  MessagesLoaderV2,
} from '@vtex/api'

import { Clients } from './clients'

if (!global.metrics) {
  console.error('No global.metrics at require time')
  global.metrics = new MetricsAccumulator()
}

declare global {
  type Context = ServiceContext<Clients, State, CustomContext>

  interface State extends RecorderState {
    messagesTenantLanguage?: MessagesLoaderV2
    messagesBindingLanguage?: MessagesLoaderV2
  }

  interface StaleRevalidateData<T>{
    ttl: Date
    data: T
  }

  interface CustomContext extends ParamsContext {
    cookie: string
    originalPath: string
    vtex: CustomIOContext
    translated?: boolean
  }

  interface CustomIOContext extends IOContext {
    segment?: SegmentData
  }

  interface Property {
    name: string
    values: [string]
  }

  interface TranslatableMessage {
    content: string
    from: string
    id: string
  }

  interface Reference {
    Key: string
    Value: string
  }

  interface AppSettings {
    slugifyLinks: boolean,
    sponsoredCount: number,
  }

  interface ServiceSettings {
    advancedAPIKey: string,
    marketplaceAPIKey: string
  }

  interface DegradedSearchError {
    service: string
    error: string
    errorStack?: unknown
  }
}
