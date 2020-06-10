const promisify = (obj: any) => {
  return new Promise(resolve => resolve(obj))
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
  productById: jest.fn((_id: string, _cacheable: boolean = true) => promisify(null)),
  productsRaw: jest.fn(() => ({ data: [] })),
  filtersInCategoryFromId: jest.fn(),
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

export const getBindingLocale = () => mockContext.vtex.binding.locale

const rewriterClientMock: any = {
  getRoute: jest.fn((id: string, type: string, bindingId: string) => promisify(`${id}-${type}-${bindingId}-${getBindingLocale()}`))
}

const getLocale = () => mockContext.vtex.locale
const getTenantLocale = () => mockContext.vtex.tenant.locale

const initialCtxState = {
  account: 'storecomponents',
  platform: 'vtex',
  locale: 'pt-BR',
  tenant: { locale: 'pt-BR' },
  binding: { id: 'abc', locale: 'pt-BR' }
}

const generateDeepCopy = (obj: any) => JSON.parse(JSON.stringify(obj))

export const mockContext: any = {
  vtex: {
    ...generateDeepCopy(initialCtxState),
  },
  clients: {
    search: searchClientMock,
    segment: segmentClientMock,
    messagesGraphQL: messagesGraphQLClientMock,
    rewriter: rewriterClientMock,
  },
  state: {
    messagesBindingLanguage: {
      loadMany: jest.fn((messages: any) => messages.map((message: any) => `${message.content}-${getLocale()}`))
    },
    messagesTenantLanguage: {
      load: jest.fn((message: any) => `${message.content}-${getTenantLocale()}`)
    }
  },
}

export const resetContext = () => {mockContext.vtex = { ...generateDeepCopy(initialCtxState) }}
