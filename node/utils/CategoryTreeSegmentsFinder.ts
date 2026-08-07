import type { LRUCache } from '@vtex/api'

import { searchSlugify } from './slug'
import type { Search } from '../clients/search'
import { CATEGORY_TREE_ROOT_PATH } from '../resolvers/search/constants'
import {
  categoryTreeChildrenCache,
  categoryTreeRootCache,
} from '../resolvers/search/modules/compatibilityCache'
import type { CacheEntry } from './cache'
import { getOrSet } from './cache'

interface Clients {
  search: Search
}

interface LazyCategoryTreeNode {
  id: number
  name: string
  hasChildren: boolean
}

export interface CategoryIdNamePair {
  id: string
  name: string
}

export class CategoryTreeSegmentsFinder {
  private clients: Clients
  private segments: string[]
  private cacheKeyPrefix: string
  protected categoryTreeRoot: Record<string, LazyCategoryTreeNode>

  constructor(clients: Clients, segments: string[], cacheKeyPrefix: string) {
    this.clients = clients
    this.segments = segments
    this.cacheKeyPrefix = cacheKeyPrefix
    this.categoryTreeRoot = {}
  }

  public find = async () => {
    const { segments } = this
    const result: Array<CategoryIdNamePair | null> = []

    await this.initCategoryTreeRoot()

    const rootCategorySegment = this.findRootCategorySegment()

    if (!rootCategorySegment) {
      return []
    }

    const { category, index } = rootCategorySegment

    result[index] = { id: category.id.toString(), name: category.name }
    const segmentsTail = segments.slice(index + 1)
    const categorySegmentsFromChildren = await this.findCategoriesFromChildren(
      category.id,
      segmentsTail
    )

    return result.concat(categorySegmentsFromChildren)
  }

  /**
   * Fetches a category's children from the in-memory cache or search
   */
  protected lazyFetchChildren = async (id: number) => {
    const { search } = this.clients

    return this.staleWhileRevalidate<Record<string, string>>(
      categoryTreeChildrenCache,
      `${this.cacheKeyPrefix}:${id.toString()}`,
      () => this.fetchChildrenFromSearch({ search, id })
    )
  }

  protected staleWhileRevalidate = async <T>(
    cache: LRUCache<string, CacheEntry<T>>,
    key: string,
    fetcher: () => Promise<T>
  ): Promise<T> => {
    return getOrSet<T>(cache, key, fetcher)
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
    this.categoryTreeRoot = await this.staleWhileRevalidate<
      Record<string, LazyCategoryTreeNode>
    >(
      categoryTreeRootCache,
      `${this.cacheKeyPrefix}:${CATEGORY_TREE_ROOT_PATH}`,
      () => this.getCategoryTreeRoot()
    )
  }

  // Returns {id: categoryId, name: categorySlug }
  private findCategoriesFromChildren = async (
    categoryId: number,
    segments: string[]
  ) => {
    const result: Array<CategoryIdNamePair | null> = []

    for (const segment of segments) {
      // eslint-disable-next-line no-await-in-loop
      const children = await this.getChildren(categoryId)
      const childCategoryId = children[segment]

      if (childCategoryId) {
        categoryId = Number(childCategoryId)
        result.push({ id: childCategoryId, name: segment })
      } else {
        result.push(null)
      }
    }

    return result
  }

  private findRootCategorySegment = () => {
    const { segments, categoryTreeRoot } = this
    const segmentIndex = segments.findIndex(
      (segment) => !!categoryTreeRoot[segment]
    )

    return segmentIndex !== -1
      ? {
          index: segmentIndex,
          category: categoryTreeRoot[segments[segmentIndex]],
        }
      : null
  }

  private getChildren = async (id: number) => {
    return this.lazyFetchChildren(id)
  }

  // Returns { categorySlug: categoryId }
  private fetchChildrenFromSearch = async (params: {
    search: Search
    id: number
  }): Promise<Record<string, string>> => {
    const { search, id } = params
    const categoryChildren = await search.getCategoryChildren(id)
    const categoryChildrenBySlug = Object.keys(categoryChildren).reduce(
      (acc, categoryChildId: string) => {
        const categoryChildName = categoryChildren[categoryChildId]
        const categoryChildSlug = searchSlugify(categoryChildName)

        acc[categoryChildSlug] = categoryChildId

        return acc
      },
      {} as Record<string, string>
    )

    return categoryChildrenBySlug
  }
}
