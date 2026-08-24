import {
  filterIgnoredDifferences,
  findDifferences,
} from '../utils/compareResults'
import {
  CATALOG_EXISTENCE_COMPARE_FIELDS,
  CATALOG_IGNORED_DIFFERENCES,
} from './pdpConfig'

describe('CATALOG_IGNORED_DIFFERENCES', () => {
  it('does not surface IS-only extra keys from product compare', () => {
    const catalog = [
      {
        productId: '94631',
        items: [{ itemId: '1' }],
      },
    ]

    const intsch = [
      {
        productId: '94631',
        items: [
          {
            itemId: '1',
            offerOrigin: 'simulation',
            attributes: [],
          },
        ],
        allSpecifications: [],
        allSpecificationsGroups: [],
      },
    ]

    const differences = findDifferences(catalog, intsch, '', {
      existenceCompareFields: CATALOG_EXISTENCE_COMPARE_FIELDS,
    })

    const { filtered } = filterIgnoredDifferences(
      differences,
      CATALOG_IGNORED_DIFFERENCES
    )

    expect(filtered).toEqual([])
  })

  it('still reports real value differences after ignoring extra keys', () => {
    const catalog = [
      {
        productId: '94631',
        productName: 'Catalog name',
        items: [{ itemId: '1' }],
      },
    ]

    const intsch = [
      {
        productId: '94631',
        productName: 'IS name',
        items: [
          {
            itemId: '1',
            offerOrigin: 'simulation',
            attributes: [{ key: 'foo', value: 'bar' }],
          },
        ],
        allSpecifications: ['Color'],
        allSpecificationsGroups: ['Info'],
      },
    ]

    const differences = findDifferences(catalog, intsch, '', {
      existenceCompareFields: CATALOG_EXISTENCE_COMPARE_FIELDS,
    })

    const { filtered } = filterIgnoredDifferences(
      differences,
      CATALOG_IGNORED_DIFFERENCES
    )

    expect(filtered).toEqual([
      {
        path: '[0].productName',
        type: 'different_value',
        expected: 'Catalog name',
        actual: 'IS name',
      },
    ])
  })

  it('ignores catalog-only productClusters keys (intsch cap of 50)', () => {
    const catalog = [
      {
        productId: '305546',
        productClusters: {
          '12': 'Kept',
          '348': 'Cuidado Corporal Seleccionado a S/. 45 c/u',
        },
      },
    ]

    const intsch = [
      {
        productId: '305546',
        productClusters: {
          '12': 'Kept',
        },
      },
    ]

    const differences = findDifferences(catalog, intsch, '', {
      existenceCompareFields: CATALOG_EXISTENCE_COMPARE_FIELDS,
    })

    const { filtered } = filterIgnoredDifferences(
      differences,
      CATALOG_IGNORED_DIFFERENCES
    )

    expect(filtered).toEqual([])
  })

  it('still reports extra or renamed productClusters after ignoring missing keys', () => {
    const catalog = [
      {
        productId: '1',
        productClusters: {
          '12': 'Old name',
        },
      },
    ]

    const intsch = [
      {
        productId: '1',
        productClusters: {
          '12': 'New name',
          '99': 'Only in IS',
        },
      },
    ]

    const differences = findDifferences(catalog, intsch, '', {
      existenceCompareFields: CATALOG_EXISTENCE_COMPARE_FIELDS,
    })

    const { filtered } = filterIgnoredDifferences(
      differences,
      CATALOG_IGNORED_DIFFERENCES
    )

    expect(filtered).toEqual(
      expect.arrayContaining([
        {
          path: '[0].productClusters.12',
          type: 'different_value',
          expected: 'Old name',
          actual: 'New name',
        },
        {
          path: '[0].productClusters.99',
          type: 'extra_key',
          actual: 'Only in IS',
        },
      ])
    )
    expect(filtered).toHaveLength(2)
  })

  it('ignores brandImageUrl differences', () => {
    const catalog = [
      {
        productId: '8934',
        brandImageUrl: 'https://example.vteximg.com.br/arquivos/ids/1/logo.svg',
      },
    ]

    const intsch = [
      {
        productId: '8934',
        brandImageUrl: null,
      },
    ]

    const differences = findDifferences(catalog, intsch, '', {
      existenceCompareFields: CATALOG_EXISTENCE_COMPARE_FIELDS,
    })

    const { filtered } = filterIgnoredDifferences(
      differences,
      CATALOG_IGNORED_DIFFERENCES
    )

    expect(filtered).toEqual([])
  })

  it('ignores GraphQL-unused offer and product payload fields', () => {
    const catalog = [
      {
        productId: '1',
        SellerVSS: ['a', 'b'],
        items: [
          {
            itemId: '1',
            sellers: [
              {
                sellerId: '1',
                commertialOffer: {
                  AvailableQuantity: 10,
                  FullSellingPrice: null,
                  IsAvailable: true,
                  PaymentOptions: null,
                  DeliverySlaSamplesPerRegion: {
                    '0': { DeliverySlaPerTypes: [], Region: null },
                  },
                  ItemMetadataAttachment: [{ Name: 'Extended warranty' }],
                },
              },
            ],
          },
        ],
      },
    ]

    const intsch = [
      {
        productId: '1',
        SellerVSS: ['b', 'a'],
        items: [
          {
            itemId: '1',
            sellers: [
              {
                sellerId: '1',
                commertialOffer: {
                  AvailableQuantity: 99999,
                  FullSellingPrice: 0,
                  IsAvailable: false,
                  PaymentOptions: {
                    installmentOptions: [
                      {
                        installments: [
                          {
                            sellerMerchantInstallments: [{ id: 'X' }],
                          },
                        ],
                      },
                    ],
                  },
                  DeliverySlaSamplesPerRegion: {},
                  ItemMetadataAttachment: [],
                },
              },
            ],
          },
        ],
      },
    ]

    const differences = findDifferences(catalog, intsch, '', {
      existenceCompareFields: CATALOG_EXISTENCE_COMPARE_FIELDS,
    })

    const { filtered } = filterIgnoredDifferences(
      differences,
      CATALOG_IGNORED_DIFFERENCES
    )

    expect(filtered).toEqual([
      {
        path: '[0].items[0].sellers[0].commertialOffer.AvailableQuantity',
        type: 'different_value',
        expected: 10,
        actual: 99999,
      },
    ])
  })

  it('ignores imageText null vs empty-or-label mismatches', () => {
    const catalog = [
      {
        productId: '1',
        items: [
          {
            itemId: '1',
            images: [
              { imageId: 'a', imageText: null },
              { imageId: 'b', imageText: null },
            ],
          },
        ],
      },
    ]

    const intsch = [
      {
        productId: '1',
        items: [
          {
            itemId: '1',
            images: [
              { imageId: 'a', imageText: '' },
              { imageId: 'b', imageText: 'Product name as label' },
            ],
          },
        ],
      },
    ]

    const differences = findDifferences(catalog, intsch, '', {
      existenceCompareFields: CATALOG_EXISTENCE_COMPARE_FIELDS,
    })

    const { filtered } = filterIgnoredDifferences(
      differences,
      CATALOG_IGNORED_DIFFERENCES
    )

    expect(filtered).toEqual([])
  })

  it('ignores extra completeSpecifications Values and length, not extra specs', () => {
    const catalog = [
      {
        productId: '1',
        completeSpecifications: [
          {
            Name: 'Género',
            Values: [{ Id: '1329', Value: 'Mujer' }],
          },
        ],
      },
    ]

    const intsch = [
      {
        productId: '1',
        completeSpecifications: [
          {
            Name: 'Género',
            Values: [
              { Id: '1329', Value: 'Mujer' },
              { Id: 'Mujer', Value: 'Mujer' },
            ],
          },
          {
            Name: 'OnlyInIS',
            Values: [{ Id: 'x', Value: 'x' }],
          },
        ],
      },
    ]

    const differences = findDifferences(catalog, intsch, '', {
      existenceCompareFields: CATALOG_EXISTENCE_COMPARE_FIELDS,
    })

    const { filtered } = filterIgnoredDifferences(
      differences,
      CATALOG_IGNORED_DIFFERENCES
    )

    expect(filtered).toEqual([
      {
        path: '[0].completeSpecifications[name:OnlyInIS]',
        type: 'extra_key',
        actual: {
          Name: 'OnlyInIS',
          Values: [{ Id: 'x', Value: 'x' }],
        },
      },
    ])
  })

  it('still reports completeSpecifications value content differences', () => {
    const catalog = [
      {
        productId: '1',
        completeSpecifications: [
          {
            Name: 'Color',
            Values: [{ Id: '1', Value: 'Black' }],
          },
        ],
      },
    ]

    const intsch = [
      {
        productId: '1',
        completeSpecifications: [
          {
            Name: 'Color',
            Values: [{ Id: '1', Value: 'White' }],
          },
        ],
      },
    ]

    const differences = findDifferences(catalog, intsch, '', {
      existenceCompareFields: CATALOG_EXISTENCE_COMPARE_FIELDS,
    })

    const { filtered } = filterIgnoredDifferences(
      differences,
      CATALOG_IGNORED_DIFFERENCES
    )

    expect(filtered).toEqual([
      {
        path: '[0].completeSpecifications[name:Color].Values[0].Value',
        type: 'different_value',
        expected: 'Black',
        actual: 'White',
      },
    ])
  })

  it('ignores PromotionTeasers but still reports Teasers differences', () => {
    const catalog = [
      {
        productId: '1',
        items: [
          {
            itemId: '1',
            sellers: [
              {
                sellerId: '1',
                commertialOffer: {
                  Teasers: [{ Name: 'Promo', Conditions: { Parameters: [] } }],
                  PromotionTeasers: [
                    { Name: 'Promo', Conditions: { Parameters: [] } },
                  ],
                },
              },
            ],
          },
        ],
      },
    ]

    const intsch = [
      {
        productId: '1',
        items: [
          {
            itemId: '1',
            sellers: [
              {
                sellerId: '1',
                commertialOffer: {
                  Teasers: [
                    {
                      Name: 'Promo',
                      Conditions: {
                        Parameters: [
                          { Name: 'PercentualDiscount', Value: '50' },
                        ],
                      },
                    },
                  ],
                  PromotionTeasers: [
                    {
                      Name: 'Promo',
                      Conditions: {
                        Parameters: [
                          { Name: 'PercentualDiscount', Value: '50' },
                        ],
                      },
                    },
                  ],
                },
              },
            ],
          },
        ],
      },
    ]

    const differences = findDifferences(catalog, intsch, '', {
      existenceCompareFields: CATALOG_EXISTENCE_COMPARE_FIELDS,
    })

    const { filtered } = filterIgnoredDifferences(
      differences,
      CATALOG_IGNORED_DIFFERENCES
    )

    expect(filtered.some((d) => d.path.includes('PromotionTeasers'))).toBe(
      false
    )
    expect(filtered).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: '[0].items[0].sellers[0].commertialOffer.Teasers[0].Conditions.Parameters',
          type: 'array_length_mismatch',
        }),
      ])
    )
  })
})
