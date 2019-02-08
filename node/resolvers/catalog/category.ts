import { compose, last, prop, split } from 'ramda'
import { toIOMessage } from '../../utils/ioMessage'

const lastSegment = compose<string, string[], string>(last, split('/'))

export const resolvers = {
  Category: {
    cacheId: prop('id'),

    href: prop('url'),

    metaTagDescription: prop('MetaTagDescription'),

    name: ({name}, _, ctx) => toIOMessage(ctx, name),

    slug: ({url}) => url ? lastSegment(url) : null,

    titleTag: prop('Title'),
  }
}
