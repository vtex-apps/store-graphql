import { compose, last, prop, split } from 'ramda'

const lastSegment = compose<string, string[], string>(last, split('/'))

export const resolvers = {
  Category: {
    cacheId: prop('id'),

    href: prop('url'),

    metaTagDescription: prop('MetaTagDescription'),

    slug: ({url}) => url ? lastSegment(url) : null,

    titleTag: prop('Title'),
  }
}
