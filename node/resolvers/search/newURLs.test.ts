/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable new-cap */
/* eslint-disable no-await-in-loop */

import * as TypeMoq from 'typemoq'
import type { IOContext } from '@vtex/api'
import { VBase } from '@vtex/api'

import { Search } from '../../clients/search'
import { mountCompatibilityQuery } from './newURLs'
import { getCompatibilityArgs } from '.'
import { Clients } from '../../clients'

const contextMock = TypeMoq.Mock.ofType<IOContext>()
const categoryTreeResponseMock = TypeMoq.Mock.ofType<CategoryTreeResponse>()
const facetsMock = TypeMoq.Mock.ofType<SearchFacets>()
const vbaseTypeMock = TypeMoq.Mock.ofInstance(VBase)
const state = TypeMoq.Mock.ofType<State>()
const customContext = TypeMoq.Mock.ofType<CustomContext>()

describe('Search new URLs dicovery', () => {
  let context: any

  class VBaseMock extends vbaseTypeMock.object {
    private jsonData: any

    constructor() {
      super(contextMock.object)
      this.jsonData = {}
    }

    public getJSON = async <T>(
      bucket: string,
      file: string,
      nullOrUndefined?: boolean | undefined
    ): Promise<T> => {
      if (!this.jsonData[bucket]) {
        return (nullOrUndefined ? null : {}) as T
      }

      return Promise.resolve(this.jsonData[bucket][file] as T)
    }

    public saveJSON = async <T>(
      bucket: string,
      file: string,
      data: T
    ): Promise<any> => {
      if (!this.jsonData[bucket]) {
        this.jsonData[bucket] = {}
      }

      this.jsonData[bucket][file] = data
    }
  }

  const search = class SearchMock extends Search {
    private categoriesResponse: CategoryTreeResponse[]
    private categoryChildrenResponse: Record<number, Record<string, string>>
    private facetsResponse: SearchFacets

    constructor(
      categories: CategoryTreeResponse[],
      categoryChildren: Record<number, Record<string, string>>,
      facets: SearchFacets
    ) {
      super(contextMock.object)
      this.categoriesResponse = categories
      this.categoryChildrenResponse = categoryChildren
      this.facetsResponse = facets
    }

    public categories = async (_: number) => {
      return Promise.resolve(this.categoriesResponse)
    }

    public getCategoryChildren = (id: number) => {
      return Promise.resolve(this.categoryChildrenResponse[id])
    }

    public facets = (_?: string) => {
      return Promise.resolve(this.facetsResponse)
    }
  }

  beforeEach(() => {
    // tslint:disable-next-line: max-classes-per-file
    const ClientsImpl = class ClientsMock extends Clients {
      public get vbase() {
        return this.getOrSet('vbase', VBaseMock)
      }
    }

    context = {
      clients: new ClientsImpl({}, contextMock.object),
      ...contextMock.object,
      ...customContext.object,
      state: {
        ...state.object,
      },
    }
  })

  it('Should transform /category in /category?map=c', async () => {
    const args = {
      query: 'category',
      map: '',
    }

    const categoryTree: CategoryTreeResponse[] = [
      {
        ...categoryTreeResponseMock.object,
        id: 1,
        name: 'category',
        hasChildren: false,
      },
    ]

    const facets = {
      ...facetsMock.object,
      SpecificationFilters: {},
    }

    const vbaseMock = new VBaseMock()
    const searchMock = new search(categoryTree, {}, facets)
    const result = await mountCompatibilityQuery({
      vbase: vbaseMock,
      search: searchMock,
      args,
    })

    expect(result).toStrictEqual({ query: 'category', map: 'c' })
  })

  it('Should transform /department/category/subcategory in /department/category/subcategory?map=c,c,c', async () => {
    const args = {
      query: 'department/category/subcategory',
      map: '',
    }

    const categoryTree: CategoryTreeResponse[] = [
      {
        ...categoryTreeResponseMock.object,
        id: 1,
        name: 'department',
        hasChildren: true,
      },
    ]

    const categoryChildren = {
      1: { '2': 'category' },
      2: { '3': 'subcategory' },
    }

    const facets = {
      ...facetsMock.object,
      SpecificationFilters: {},
    }

    const vbaseMock = new VBaseMock()
    const searchMock = new search(categoryTree, categoryChildren, facets)
    const result = await mountCompatibilityQuery({
      vbase: vbaseMock,
      search: searchMock,
      args,
    })

    expect(result).toStrictEqual({
      query: 'department/category/subcategory',
      map: 'c,c,c',
    })
  })

  it('Should transform /category/brand?map=b in /category?map=c,b', async () => {
    const args = {
      query: 'category/brand',
      map: 'b',
    }

    const categoryTree: CategoryTreeResponse[] = [
      {
        ...categoryTreeResponseMock.object,
        id: 1,
        name: 'category',
        hasChildren: false,
      },
    ]

    const categoryChildren = { 1: {} }

    const facets = {
      ...facetsMock.object,
      SpecificationFilters: {},
    }

    const vbaseMock = new VBaseMock()
    const searchMock = new search(categoryTree, categoryChildren, facets)
    const result = await mountCompatibilityQuery({
      vbase: vbaseMock,
      search: searchMock,
      args,
    })

    expect(result).toStrictEqual({ query: 'category/brand', map: 'c,b' })
  })

  it('Should transform /collection?map=productClusterIds in /collection?map=productClusterIds', async () => {
    const args = {
      query: 'collection',
      map: 'productClusterIds',
    }

    const categoryTree: CategoryTreeResponse[] = []

    const categoryChildren = {}

    const facets = {
      ...facetsMock.object,
      SpecificationFilters: {},
    }

    const vbaseMock = new VBaseMock()
    const searchMock = new search(categoryTree, categoryChildren, facets)
    const result = await mountCompatibilityQuery({
      vbase: vbaseMock,
      search: searchMock,
      args,
    })

    expect(result).toStrictEqual({
      query: 'collection',
      map: 'productClusterIds',
    })
  })

  it('Should transform /filterxpto?map=specificationFilter_0 in /filterxpto?map=specificationFilter_0', async () => {
    const args = {
      query: 'filterxpto',
      map: 'specificationFilter_0',
    }

    const categoryTree: CategoryTreeResponse[] = []

    const categoryChildren = {}

    const facets = {
      ...facetsMock.object,
      SpecificationFilters: {},
    }

    const vbaseMock = new VBaseMock()
    const searchMock = new search(categoryTree, categoryChildren, facets)
    const result = await mountCompatibilityQuery({
      vbase: vbaseMock,
      search: searchMock,
      args,
    })

    expect(result).toStrictEqual({
      query: 'filterxpto',
      map: 'specificationFilter_0',
    })
  })

  it('Should transform /department/style_1/color_2/size_3 in /department/1/2/3?map=c,specificationFilter_1,specificationFilter_2,specificationFilter_3', async () => {
    const args = {
      query: 'department/style_1/color_2/size_3',
      map: '',
    }

    const categoryTree: CategoryTreeResponse[] = [
      {
        ...categoryTreeResponseMock.object,
        id: 1,
        name: 'department',
        hasChildren: false,
      },
    ]

    const categoryChildren = { 1: {} }

    const facets = {
      ...facetsMock.object,
      SpecificationFilters: {
        style: [
          {
            Name: '1',
            Map: 'specificationFilter_1',
            Value: '1',
          },
        ],
        color: [
          {
            Name: '2',
            Map: 'specificationFilter_2',
            Value: '2',
          },
        ],
        size: [
          {
            Name: '3',
            Map: 'specificationFilter_3',
            Value: '3',
          },
        ],
      },
    }

    const vbaseMock = new VBaseMock()
    const searchMock = new search(categoryTree, categoryChildren, facets as any)
    const result = await mountCompatibilityQuery({
      vbase: vbaseMock,
      search: searchMock,
      args,
    })

    expect(result).toStrictEqual({
      query: 'department/1/2/3',
      map: 'c,specificationFilter_1,specificationFilter_2,specificationFilter_3',
    })
  })

  it('Should transform /department/style_1/brand?map=b in /department/style_1/brand?map=c,specificationFilter_1,b', async () => {
    const args = {
      query: 'department/style_1/brand',
      map: 'b',
    }

    const categoryTree: CategoryTreeResponse[] = [
      {
        ...categoryTreeResponseMock.object,
        id: 1,
        name: 'department',
        hasChildren: false,
      },
    ]

    const categoryChildren = { 1: {} }

    const facets = {
      ...facetsMock.object,
      SpecificationFilters: {
        style: [
          {
            Name: '1',
            Map: 'specificationFilter_1',
            Value: '1',
          },
        ],
      },
    }

    const vbaseMock = new VBaseMock()
    const searchMock = new search(categoryTree, categoryChildren, facets as any)
    const result = await mountCompatibilityQuery({
      vbase: vbaseMock,
      search: searchMock,
      args,
    })

    expect(result).toStrictEqual({
      query: 'department/1/brand',
      map: 'c,specificationFilter_1,b',
    })
  })

  it('Should not transform urls in the format query?map=c', async () => {
    const argsList = [
      {
        map: 'c',
        query: 'category',
      },
      {
        map: 'specificationFilter_1',
        query: 'filtertest',
      },
      {
        map: 'c,specificationFilter_1',
        query: 'category/filtertest',
      },
      {
        map: 'specificationFilter_1,c,b',
        query: 'filtertest/category/brand',
      },
    ]

    for (const args of argsList) {
      const result = await getCompatibilityArgs(context, args)

      expect(result).toStrictEqual(args)
    }
  })
})
