import { extractSlug } from '.'
import { toProductIOMessage, toIOMessage } from '../../utils/ioMessage'

export const resolvers = {
  Items: {
    name: ({name, id}: {name: string, id?: string}, _: any, { clients: {segment} }: Context) => id != null
      ? toProductIOMessage('name')(segment, name, id)
      : toIOMessage(segment, name, name),

    slug: (root: any) => extractSlug(root),
  }
}
