import { resolvers } from './sku'

const skuAttributesResolver = resolvers.SKU.attributes

const baseItem = {
  itemId: '1',
  name: 'SKU 1',
  nameComplete: 'SKU 1 Complete',
  complementName: '',
  ean: '',
  referenceId: [],
  measurementUnit: 'un',
  unitMultiplier: 1,
  modalType: null,
  images: [],
  Videos: [],
  videos: [],
  variations: [],
  sellers: [],
  attachments: [],
  isKit: false,
} as unknown as SearchItem

describe('SKU.attributes resolver (non-structured SKU specifications, SkuNonStructuredAttribute)', () => {
  it('returns the IS attributes as-is (upstream contract guarantees non-null fields)', () => {
    const item: SearchItem = {
      ...baseItem,
      attributes: [
        { id: '101', name: 'Finish', value: 'Polished Chrome', visible: true },
        { id: '102', name: 'Internal Code', value: 'INT-9', visible: false },
      ],
    }

    expect(skuAttributesResolver(item)).toEqual([
      { id: '101', name: 'Finish', value: 'Polished Chrome', visible: true },
      { id: '102', name: 'Internal Code', value: 'INT-9', visible: false },
    ])
  })

  it('returns [] when the SKU has no attributes field (legacy Portal Search)', () => {
    expect(skuAttributesResolver(baseItem)).toEqual([])
  })

  it('returns [] when attributes is an empty array', () => {
    const item: SearchItem = { ...baseItem, attributes: [] }

    expect(skuAttributesResolver(item)).toEqual([])
  })

  it('returns [] when attributes is null', () => {
    const item = {
      ...baseItem,
      attributes: null as unknown as SearchItem['attributes'],
    } as SearchItem

    expect(skuAttributesResolver(item)).toEqual([])
  })
})
