import { prop } from 'ramda'

import { Slugify } from './slug'

export const resolvers = {
  Brand: {
    titleTag: prop('title'),

    metaTagDescription: prop('metaTagDescription'),

    active: prop('isActive'),

    cacheId: (brand: any) => Slugify(brand.name),

    slug: (brand: any) => Slugify(brand.name),
  },
}
