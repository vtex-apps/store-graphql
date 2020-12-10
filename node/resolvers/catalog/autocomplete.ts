import { path, split } from 'ramda'

/**
 * It will extract the slug from the HREF in the item
 * passed as parameter.
 *
 * That is needed once the API provide only the old link
 * (from CMS portal) to access the product page, nothing
 * more.
 *
 * HREF provided:
 * https://portal.vtexcommercestable.com.br/:slug/p
 *
 * @param item The item to extract the information
 */
const extractSlug = (item: any) => {
  const href = split('/', item.href)

  return item.criteria ? `${href[3]}/${href[4]}` : href[3]
}

export const resolvers = {
  Items: {
    slug: (root: any) => extractSlug(root),

    productId: ({ items }: { items?: [{ productId?: string }] }) =>
      items ? path([0, 'productId'], items) : null,
  },
}
