import { searchSlugify } from "./slug"


export const categoryTreeSearch = (categoryTree: CategoryTreeResponse[], query: string) => {
  const querySegments = query.startsWith('/')? query.split('/').slice(1): query.split('/')

  return bfsCategory(categoryTree, querySegments, 0)
}

const bfsCategory = (categoryTree: CategoryTreeResponse[], segments: string[], depth: number): CategoryTreeResponse[]  => {
  if(segments.length === 0 || segments.length === depth){
    return []
  }

  for (const categoryNode of categoryTree){
    if(searchSlugify(categoryNode.name) === segments[depth]){
      return [categoryNode, ...bfsCategory(categoryNode.children, segments, depth + 1)]
    }
  }

  segments.shift()

  return []
}