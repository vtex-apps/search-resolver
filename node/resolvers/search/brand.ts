import { prop } from 'ramda'

import { searchSlugify } from '../../utils/slug'

export const resolvers = {
  Brand: {

    titleTag: prop('title'),

    active: prop('isActive'),

    cacheId: (brand: Brand) => searchSlugify(brand.name),

    slug: (brand: Brand) => searchSlugify(brand.name),
  },
}
