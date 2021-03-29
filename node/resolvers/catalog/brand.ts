import { prop } from 'ramda'

import { catalogSlugify } from './slug'

export const resolvers = {
  Brand: {
    titleTag: prop('title'),

    metaTagDescription: prop('metaTagDescription'),

    active: prop('isActive'),

    cacheId: (brand: any) => catalogSlugify(brand.name),

    slug: (brand: any) => catalogSlugify(brand.name),
  },
}
