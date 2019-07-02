import { path } from 'ramda'

import { extractSlug } from '.'
import { toIOMessage, toProductIOMessage } from '../../utils/ioMessage'

export const resolvers = {
  Items: {
    name: ({name, id}: {name: string, id?: string}, _: any, { clients: {segment} }: Context) => id != null
      ? toProductIOMessage('name')(segment, name, id)
      : toIOMessage(segment, name, name),

    slug: (root: any) => extractSlug(root),

    productId: ({items}: {items?: [{productId?: string}]}) => !!items
      ? path([0, 'productId'], items)
      : null,
  }
}
