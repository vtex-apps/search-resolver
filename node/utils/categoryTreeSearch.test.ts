import * as TypeMoq from 'typemoq'
import { CategoryTreeSegmentsFinder } from "./CategoryTreeSegmentsFinder"
import { IOContext } from "@vtex/api"
import { Search } from "../clients/search"

/*  CategoryTree 
 *         c0 
 *        / \  
 *      c1   c2 
 *     / \      
 *   c3   c4
 *         \
 *          c5
 */

const context = TypeMoq.Mock.ofType<IOContext>()
const searchMock = TypeMoq.Mock.ofInstance(Search)

const c5 = {'c5': '5'}
const c4 = {'c4': '4'}
const c3 = {'c3': '3'}
const c2 = {'c2': '2'}
const c1 = { 'c1': '1'}
const c0 = { 'c0': '0' }
const root = {'c0': {id: 0, name: 'c0', hasChildren: true}}

const childrenTree = {
  "0": {...c1, ...c2},
  "1": {...c3, ...c4},
  "2": {},
  "3": {},
  "4": {...c5},
  "5": {}
} as any

const clients = { search: new searchMock.object(context.object) }

const toPair = (categories: any[]) => 
  categories.map(c => {
    const [key, value] = c && Object.entries(c)[0] || []
    return key? { id: value, name: key }: null
  })

describe('Category Tree Search tests', () => {
  const finder = class CategoryTreeSegmentsFinderMock extends CategoryTreeSegmentsFinder {
    public constructor(segments: string[]){
      super(clients, segments)
      this.categoryTreeRoot = root
    }

    protected lazyFetchChildren = async (id: number) => {
      const children = childrenTree[id.toString()]
      return children
    }

    protected getCategoryTreeRoot = () => {
      return this.categoryTreeRoot as any
    }
  }
  test('It should find a complete tree of categories', async () => {
    const segments = 'c0/c1/c4'.split('/')
    const treeFinder = new finder(segments)
    const result = await treeFinder.find()
    expect(result).toStrictEqual(toPair([c0, c1, c4]))
  })

  test('It should find the maximum categories possible ', async () => {
    const segments = 'c0/c1/c2'.split('/')
    const treeFinder = new finder(segments)
    const result = await treeFinder.find()
    expect(result).toStrictEqual(toPair([c0, c1, null]))
  })

  test('It should not find when doesnt exist', async () => {
    const segments = 'x/c1/c4'.split('/')
    const treeFinder = new finder(segments)
    const result = await treeFinder.find()
    expect(result).toStrictEqual([])
  })
})