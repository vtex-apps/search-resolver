import { searchSlugify } from './slug'
import { Search } from '../clients/search'
interface Clients{
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
    this.categoryTreeRoot = await this.getCategoryTreeRoot()
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
    const { search } = this.clients
    return await this.fetchChildrenFromSearch({ search, id })
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