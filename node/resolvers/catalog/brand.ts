import { prop } from 'ramda'
import * as slugify from 'slugify'

export const resolvers = {
  Brand: {
    active: prop('isActive'),
    cacheId: brand => slugify(brand.name, { lower: true }),
    slug: brand => slugify(brand.name, { lower: true }),
    titleTag: prop('title'),
  }
}
