import { compose, last, prop, split } from 'ramda'

import { toCategoryIOMessage } from '../../utils/ioMessage'

const lastSegment = compose<string, string[], string>(
  last,
  split('/')
)

function cleanUrl(url: string) {
  return url.replace(/https:\/\/[A-z0-9]+\.vtexcommercestable\.com\.br/, '')
}

export const pathToCategoryHref = (path: string) => {
  const isDepartment = path.slice(1).indexOf('/') === -1
  return isDepartment ? `${path}/d` : path
}

export const resolvers = {
  Category: {
    cacheId: prop('id'),

    href: compose(
      pathToCategoryHref,
      cleanUrl,
      prop('url') as any
    ),

    metaTagDescription: prop('MetaTagDescription'),

    name: async (
      { id, name }: Category,
      _: any,
      { clients: { segment } }: Context
    ) => {
      return toCategoryIOMessage('name')(segment, name, id)
    },

    slug: async ({ url }: Category, _: any) => {
      return url ? lastSegment(url) : null
    },

    titleTag: prop('Title'),
  },
}
