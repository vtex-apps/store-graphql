import { compose, last, prop, split } from 'ramda'

import { toCategoryIOMessage } from '../../utils/ioMessage'
import { getCategoryInfo } from './utils'

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

    href: async (
      { id, url }: Category,
      _: any,
      { clients: { catalog } }: Context
    ) => {
      if (url == null) {
        const category = await getCategoryInfo(catalog, id, 4)
        url = category.url
      }
      const path = cleanUrl(url)

      // If the path is `/clothing`, we know that's a department
      // But if it is `/clothing/shirts`, it's not.
      return pathToCategoryHref(path)
    },

    metaTagDescription: prop('MetaTagDescription'),

    name: async (
      { id, name }: Category,
      _: any,
      { clients: { segment } }: Context
    ) => {
      return toCategoryIOMessage('name')(segment, name, id)
    },

    slug: async (
      { id, url }: Category,
      _: any,
      { clients: { catalog } }: Context
    ) => {
      if (url == null) {
        const category = await getCategoryInfo(catalog, id, 4)
        url = category.url
      }
      return url ? lastSegment(url) : null
    },

    titleTag: prop('Title'),

    children: async (
      { id, children }: Category,
      _: any,
      { clients: { catalog } }: Context
    ) => {
      if (children == null) {
        const category = await getCategoryInfo(catalog, id, 4)
        children = category.children
      }
      return children
    },
  },
}
