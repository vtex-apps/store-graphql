import { prop } from 'ramda'

import { Slugify } from './slug'
import { toBrandIOMessage } from './../../utils/ioMessage'

export const resolvers = {
  Brand: {
    name: (
      { name, id }: any,
      _: any,
      { clients: { segment } }: Context
    ) => toBrandIOMessage('name')(segment, name, id),

    title: (
      { title, id }: any,
      _: any,
      { clients: { segment } }: Context
    ) => toBrandIOMessage('title')(segment, title, id),

    metaTagDescription: (
      { metaTagDescription, id }: any,
      _: any,
      { clients: { segment } }: Context
    ) => toBrandIOMessage('metaTagDescription')(segment, metaTagDescription, id),

    active: prop('isActive'),

    cacheId: (brand: any) => Slugify(brand.name),

    slug: (brand: any) => Slugify(brand.name),

  }
}
