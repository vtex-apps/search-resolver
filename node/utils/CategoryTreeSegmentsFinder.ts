import { searchSlugify } from './slug'
import { VBase } from '@vtex/api'
import { Search } from '@vtex/clients'
import { CATEGORY_TREE_CHILDREN_BUCKET, CATEGORY_TREE_ROOT_BUCKET, CATEGORY_TREE_ROOT_PATH } from '../resolvers/search/constants'
import { staleFromVBaseWhileRevalidate } from './vbase'
interface Clients{
  vbase: VBase
  search: Search
}

interface LazyCategoryTreeNode{
  id: number
  name: string
  hasChildren: boolean
}

export interface CategoryIdNamePair{
  id: string
  name: string
}

export class CategoryTreeSegmentsFinder {
  private clients: Clients
  private segments: string[]
  protected categoryTreeRoot: Record<string, LazyCategoryTreeNode>

  public constructor(clients: Clients, segments: string[]){
    this.clients = clients
    this.segments = segments
    this.categoryTreeRoot = {}
  }

  public find = async () => {
    const { segments } = this
    const result: (CategoryIdNamePair|null)[] = []
    await this.initCategoryTreeRoot()

    const rootCategorySegment = this.findRootCategorySegment()
    if(!rootCategorySegment){
      return []
    }

    const {category, index} = rootCategorySegment

    result[index] = {id: category.id.toString(), name: category.name}
    const segmentsTail = segments.slice(index+1)
    const categorySegmentsFromChildren = await this.findCategoriesFromChildren(category.id, segmentsTail)
    return result.concat(categorySegmentsFromChildren)
  }

  /**
   * Fetches a category children from vbase or search
   * clients: {vbase: VBase, search: Search}
   */
  protected lazyFetchChildren = async (id: number) => {
    const { search } = this.clients
    return await this.staleWhileRevalidate<Record<string, string>>(CATEGORY_TREE_CHILDREN_BUCKET, id.toString(), this.fetchChildrenFromSearch, { search, id })
  }

  protected staleWhileRevalidate = async <T>(bucket: string, path: string,validateFunction: (params?: any) => Promise<T>, params?: any) => {
    return await staleFromVBaseWhileRevalidate<T>(this.clients.vbase, bucket, path, validateFunction, params)
  }

  protected getCategoryTreeRoot = async () => {
    const categoryTree = await this.clients.search.categories(0)
    return categoryTree.reduce((acc, categoryTreeNode) => {
      const categorySlug = searchSlugify(categoryTreeNode.name)
      const lazyCategoryTreeNode = {
        id: categoryTreeNode.id,
        name: categoryTreeNode.name,
        hasChildren: categoryTreeNode.hasChildren,
      }
      acc[categorySlug] = lazyCategoryTreeNode
      return acc
    }, {} as Record<string, LazyCategoryTreeNode>)
  }

  private initCategoryTreeRoot = async () => {
    this.categoryTreeRoot = await this.staleWhileRevalidate<Record<string, LazyCategoryTreeNode>>(
      CATEGORY_TREE_ROOT_BUCKET, CATEGORY_TREE_ROOT_PATH, this.getCategoryTreeRoot)
  }

  // Returns {id: categoryId, name: categorySlug }
  private findCategoriesFromChildren = async (categoryId: number, segments: string[]) => {
    const result: (CategoryIdNamePair|null)[] = []
    for(const segment of segments){
      const children = await this.getChildren(categoryId)
      const childCategoryId = children[segment]
      if(childCategoryId){
        categoryId = Number(childCategoryId)
        result.push({ id: childCategoryId, name: segment })
      }else{
        result.push(null)
      }
    }
    return result
  }

  private findRootCategorySegment = () => {
    const { segments, categoryTreeRoot } = this
    const segmentIndex = segments.findIndex(segment => !!categoryTreeRoot[segment])
    return segmentIndex !== -1? {index: segmentIndex, category: categoryTreeRoot[segments[segmentIndex]]}: null
  }

  private getChildren = async (id: number) => {
    return await this.lazyFetchChildren(id)
  }

  // Returns { categorySlug: categoryId }
  private fetchChildrenFromSearch = async (params: { search: Search, id: number }): Promise<Record<string, string>> => {
    const {search, id} = params
    const categoryChildren = await search.getCategoryChildren(id)
    const categoryChildrenBySlug = Object.keys(categoryChildren).reduce((acc, categoryChildId: string) => {
      const categoryChildName = categoryChildren[categoryChildId]
      const categoryChildSlug = searchSlugify(categoryChildName)
      acc[categoryChildSlug] = categoryChildId
      return acc
    }, {} as Record<string, string>)
    return categoryChildrenBySlug
  }
}
