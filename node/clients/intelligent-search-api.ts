import { ExternalClient, InstanceOptions, IOContext } from "@vtex/api";

export interface CorrectionParams {
  query: string
  locale?: string
}

export class IntelligentSearchApi extends ExternalClient {
  private locale: string | undefined
  // private store: string

  public constructor(context: IOContext, options?: InstanceOptions) {
    super(`http://${context.workspace}--${context.account}.myvtex.com/_v/api/intelligent-search`, context, {
      ...options,
      headers: {
        ...options?.headers,
      }
    })

    const { locale, tenant } = context
    // this.store = account
    this.locale = locale ?? tenant?.locale
  }

  public async topSearches() {
    return this.http.get('/top_searches', {params: {
      locale: this.locale
    }})
  }

  public async correction(params: CorrectionParams) {
    return this.http.get('/correction_search', {params: {...params, locale: this.locale}})
  }
}
