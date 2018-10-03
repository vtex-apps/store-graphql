import { prop } from 'ramda'
import * as slugify from 'slugify'

const Slugify = name => slugify(name, { lower: true, remove: /[*+~.()'"!:@]/g }),

export const resolvers = {
  Brand: {
    active: prop('isActive'),
    cacheId: brand => Slugify(brand.name),
    slug: brand => Slugify(brand.name),
    titleTag: prop('title'),
  }
}
