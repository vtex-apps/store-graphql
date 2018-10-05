import { prop } from 'ramda'
import { Slugify } from './slug'

export const resolvers = {
  Brand: {
    active: prop('isActive'),
    cacheId: brand => Slugify(brand.name),
    slug: brand => Slugify(brand.name),
    titleTag: prop('title'),
  }
}
