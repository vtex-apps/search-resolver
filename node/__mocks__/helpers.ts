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
  productById: jest.fn((_id: string, _cacheable: boolean = true) => promisify(null))
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

export const mockContext = {
  vtex: {
    account: 'storecomponents',
    platform: 'vtex',
    locale: 'pt-BR',
    tenant: { locale: 'pt-BR' },
  },
  clients: {
    search: searchClientMock,
    segment: segmentClientMock,
    messagesGraphQL: messagesGraphQLClientMock,
  },
}
