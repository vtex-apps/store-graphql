import { prop } from 'ramda'

import { toBrandIOMessage } from '../../utils/ioMessage'
import { Slugify } from './slug'

export const resolvers = {
  Brand: {
    active: prop('isActive'),

    cacheId: (brand: any) => Slugify(brand.name),

    slug: (brand: any) => Slugify(brand.name),

    titleTag: prop('title'),

    name: ({id, name}: {id: string, name: string}, _: any, { clients: { segment } }: Context) =>
      toBrandIOMessage('brand')(segment, name, id),
  }
}
