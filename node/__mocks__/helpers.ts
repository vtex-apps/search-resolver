/* eslint-disable @typescript-eslint/no-use-before-define */
const promisify = (obj: any) => {
  return new Promise((resolve) => resolve(obj))
}

const searchClientMock = {
  pageType: jest.fn((query: string) =>
    promisify({
      id: '1',
      name: query,
      url: `${query}-url`,
      title: `${query}-title`,
      metaTagDescription: `${query}-metaTagDescription`,
    })
  ),
  category: jest.fn(),
  categories: jest.fn(),
  crossSelling: jest.fn(),
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  productById: jest.fn((_id: string, _cacheable = true) => promisify(null)),
  filtersInCategoryFromId: jest.fn(),
}

const isClientMock = {
  productSearch: jest.fn((params: any) => {
    const { query, map } = params

    return promisify({
      translatedArgs: { query, map },
    })
  }),
}

const messagesGraphQLClientMock = {
  translate: (str: string) => promisify(str),
}

const segmentClientMock = {
  getSegmentByToken: () =>
    promisify({
      cultureInfo: 'en-US',
    }),
  getSegment: () =>
    promisify({
      cultureInfo: 'en-US',
    }),
}

const generateDeepCopy = (obj: any) => JSON.parse(JSON.stringify(obj))

const rewriterClientMock: any = {
  getRoute: jest.fn((id: string, type: string, bindingId: string) =>
    promisify(`${id}-${type}-${bindingId}-${getBindingLocale()}`)
  ),
}

const getLocale = () => mockContext.vtex.locale
const getTenantLocale = () => mockContext.vtex.tenant.locale

const initialCtxState = {
  account: 'storecomponents',
  platform: 'vtex',
  locale: 'pt-BR',
  tenant: { locale: 'pt-BR' },
  binding: { id: 'abc', locale: 'pt-BR' },
}

export const mockContext: any = {
  vtex: {
    ...generateDeepCopy(initialCtxState),
  },
  clients: {
    search: searchClientMock,
    segment: segmentClientMock,
    messagesGraphQL: messagesGraphQLClientMock,
    rewriter: rewriterClientMock,
    vbase: { getJSON: jest.fn() },
    intelligentSearchApi: isClientMock,
  },
  state: {
    messagesBindingLanguage: {
      loadMany: jest.fn((messages: any) =>
        messages.map((message: any) => `${message.content}-${getLocale()}`)
      ),
    },
    messagesTenantLanguage: {
      load: jest.fn(
        (message: any) => `${message.content}-${getTenantLocale()}`
      ),
    },
  },
}

export const getBindingLocale = () => mockContext.vtex.binding.locale

export const resetContext = () => {
  mockContext.vtex = { ...generateDeepCopy(initialCtxState) }
}
