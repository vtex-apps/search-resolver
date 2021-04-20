import { attributesToFilters, buildHref } from './attributes'

describe('attributesToFilters', () => {
  it('should convert a text attribute correctly', () => {
    expect(
      attributesToFilters({
        total: 108,
        attributes: [
          {
            visible: true,
            values: [
              {
                id: undefined,
                count: 108,
                active: false,
                key: 'lions-pride',
                label: 'Lions Pride',
              },
            ],
            key: 'brand',
            label: 'Brand',
            originalKey: 'brand',
            originalLabel: 'Brand',
            type: 'text' as 'text',
          },
        ],
        removeHiddenFacets: false,
        breadcrumb: [],
      })
    ).toEqual([
      {
        hidden: false,
        name: 'Brand',
        type: 'TEXT',
        values: [
          {
            href: 'lions-pride?map=brand',
            id: undefined,
            key: 'brand',
            name: 'Lions Pride',
            quantity: 108,
            selected: false,
            value: 'lions-pride',
          },
        ],
      },
    ])
  })

  it('should convert price attribute correctly', () => {
    expect(
      attributesToFilters({
        total: 367,
        attributes: [
          {
            visible: true,
            values: [
              {
                count: 180,
                active: false,
                from: '*',
                to: '30',
              },
              {
                count: 90,
                active: false,
                from: '30',
                to: '50',
              },
              {
                count: 97,
                active: false,
                from: '50',
                to: '*',
              },
            ],
            active: false,
            key: 'price',
            label: 'Price',
            originalKey: 'price',
            originalLabel: 'Price',
            type: 'number' as 'number',
            minValue: 10,
            maxValue: 100,
          },
        ],
        removeHiddenFacets: false,
        breadcrumb: [],
      })
    ).toEqual([
      {
        values: [
          {
            quantity: 180,
            name: '',
            key: 'price',
            selected: false,
            range: { from: 10, to: 30 },
          },
          {
            quantity: 90,
            name: '',
            key: 'price',
            selected: false,
            range: { from: 30, to: 50 },
          },
          {
            quantity: 97,
            name: '',
            key: 'price',
            selected: false,
            range: { from: 50, to: 100 },
          },
        ],
        type: 'PRICERANGE',
        name: 'Price',
        hidden: false,
      },
    ])
  })

  it('should convert number attributes correctly', () => {
    expect(
      attributesToFilters({
        total: 13,
        attributes: [
          {
            visible: true,
            values: [
              {
                count: 13,
                active: false,
                from: '0',
                to: '*',
              },
            ],
            active: false,
            key: 'polegadas',
            label: 'Polegadas',
            originalKey: 'polegadas',
            originalLabel: 'Polegadas',
            type: 'number' as 'number',
            minValue: 0,
            maxValue: 0,
          },
        ],
        removeHiddenFacets: false,
        breadcrumb: [],
      })
    ).toEqual([
      {
        hidden: false,
        name: 'Polegadas',
        type: 'TEXT',
        values: [
          {
            key: 'polegadas',
            name: '0 - 0',
            quantity: 13,
            selected: false,
            value: '0:0',
            range: {
              from: 0,
              to: 0,
            },
          },
        ],
      },
    ])
  })

  it('should convert not selected location attributes correctly', () => {
    expect(
      attributesToFilters({
        total: 124,
        attributes: [
          {
            visible: true,
            values: [
              {
                count: 71,
                active: false,
                from: '0',
                to: '5505580',
              },
              {
                count: 53,
                active: false,
                from: '0',
                to: '4477620',
              },
            ],
            active: false,
            key: 'location',
            label: 'Location',
            originalKey: 'location',
            originalLabel: 'Location',
            type: 'location' as 'location',
            minValue: 2421698.143072009,
            maxValue: 6533501.777013255,
          },
        ],
        removeHiddenFacets: false,
        breadcrumb: [],
      })
    ).toEqual([
      {
        hidden: false,
        name: 'Location',
        type: 'TEXT',
        values: [
          {
            key: 'location',
            name: '0 - 5505580',
            quantity: 71,
            selected: false,
            value: 'l:0:5505580',
            range: {
              from: 0,
              to: 5505580,
            },
          },
          {
            key: 'location',
            name: '0 - 4477620',
            quantity: 53,
            selected: false,
            value: 'l:0:4477620',
            range: {
              from: 0,
              to: 4477620,
            },
          },
        ],
      },
    ])
  })

  it('should convert selected location attributes correctly', () => {
    expect(
      attributesToFilters({
        total: 124,
        attributes: [
          {
            visible: true,
            values: [
              {
                count: 71,
                active: false,
                from: '0',
                to: '5505580',
              },
              {
                count: 53,
                active: false,
                from: '0',
                to: '4477620',
              },
            ],
            active: true,
            activeFrom: '0',
            activeTo: '3605120',
            key: 'location',
            label: 'Location',
            originalKey: 'location',
            originalLabel: 'Location',
            type: 'location' as 'location',
            minValue: 2421698.143072009,
            maxValue: 6533501.777013255,
          },
        ],
        removeHiddenFacets: false,
        breadcrumb: [],
      })
    ).toEqual([
      {
        hidden: false,
        name: 'Location',
        type: 'TEXT',
        values: [
          {
            key: 'location',
            name: '0 - 3605120',
            quantity: 124,
            selected: true,
            value: 'l:0:3605120',
            range: {
              from: 2421698.143072009,
              to: 6533501.777013255,
            },
          },
        ],
      },
    ])
  })
})

describe('buildHref', () => {
  it('should create an href from nothing', () => {
    expect(buildHref('', '', '')).toEqual('')
    expect(buildHref('', 'hello', 'world')).toEqual('world?map=hello')
  })

  it('should create an href from existing base', () => {
    expect(buildHref('hello?map=world', 'ola', 'mundo')).toEqual(
      'hello/mundo?map=world,ola'
    )
  })
})
