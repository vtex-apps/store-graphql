import { prop } from 'ramda'

import { Slugify } from './slug'
import { toBrandIOMessage } from './../../utils/ioMessage'
import { getRoute } from './../../utils/routes'

export const resolvers = {
  Brand: {
    name: (
      { name, id }: any,
      _: any,
      { clients: { segment } }: Context
    ) => toBrandIOMessage('name')(segment, name, id),

    titleTag: (
      { title, id }: any,
      _: any,
      { clients: { segment } }: Context
    ) => toBrandIOMessage('titleTag')(segment, title, id),

    metaTagDescription: (
      { metaTagDescription, id }: any,
      _: any,
      { clients: { segment } }: Context
    ) => toBrandIOMessage('metaTagDescription')(segment, metaTagDescription, id),

    active: prop('isActive'),

    cacheId: (brand: any) => Slugify(brand.name),

    slug: (brand: any) => Slugify(brand.name),

    canonicalRoute: (brand: any, _: any, ctx: Context ) =>
      getRoute(ctx, 'brand', 'canonical', {
        ...brand,
        brand: Slugify(brand.name),
      }),

    internalRoute: async (brand: any, _: any, ctx: Context ) =>
      getRoute(ctx, 'brand', 'internal', {
        ...brand,
        brand: Slugify(brand.name),
      }),
  }
}
