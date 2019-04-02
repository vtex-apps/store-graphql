import { compose, last, prop, split } from 'ramda'
import { toIOMessage } from '../../utils/ioMessage'

const lastSegment = compose<string, string[], string>(last, split('/'))

export const resolvers = {
  Category: {
    cacheId: prop('id'),

    href: prop('url'),

    metaTagDescription: prop('MetaTagDescription'),

    name: ({name}: any, _: any, ctx: Context) => toIOMessage(ctx, name, `category-${name}`),

    slug: ({url}: any) => url ? lastSegment(url) : null,

    titleTag: prop('Title'),
  }
}
