import { prop } from 'ramda'

import { formatTranslatableProp } from '../../utils/i18n'
import { searchSlugify } from '../../utils/slug'

export const resolvers = {
  Brand: {
    name: formatTranslatableProp<Brand, 'name', 'id'>(
      'name',
      'id'
    ),

    titleTag: formatTranslatableProp<Brand, 'title', 'id'>(
      'title',
      'id'
    ),

    metaTagDescription: formatTranslatableProp<Brand, 'metaTagDescription', 'id'>(
      'metaTagDescription',
      'id'
    ),

    active: prop('isActive'),

    cacheId: (brand: Brand) => searchSlugify(brand.name),

    slug: (brand: Brand) => searchSlugify(brand.name),
  },
}
