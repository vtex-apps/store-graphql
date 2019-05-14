import { prop } from 'ramda'

import { Slugify } from './slug'

export const resolvers = {
  Brand: {
    active: prop('isActive'),

    cacheId: (brand: any) => Slugify(brand.name),

    slug: (brand: any) => Slugify(brand.name),

    titleTag: prop('title'),
  }
}
