import { prop } from 'ramda'

import { getCategoryInfo } from './utils'
import { formatTranslatableProp } from '../../utils/i18n'
import { catalogSlugify } from './slug'

const getTypeForCategory = (url: string) => {
  switch (url.split('/').length) {
    case 2:
      return 'department'

    case 3:
      return 'category'

    default:
      return 'subcategory'
  }
}

const lastSegment = (route: string) => {
  const splittedSegments = route.split('/')

  return splittedSegments[splittedSegments.length - 1]
}

function cleanUrl(url: string) {
  return url.replace(/^.*(vtexcommercestable\.com\.br)/, '')
}

export const pathToCategoryHref = (path: string) => {
  const isDepartment = path.slice(1).indexOf('/') === -1

  return isDepartment ? `${path}/d` : path
}

/** This type has to be created because the Catlog API to get category by ID does not return the url or children for now.
 * These fields only come if you get the category from the categroy tree api.
 */
interface SafeCategory
  extends Pick<
    Category,
    'id' | 'name' | 'hasChildren' | 'MetaTagDescription' | 'Title'
  > {
  url: string | null
  children: Category[] | null
}

export const resolvers = {
  Category: {
    name: formatTranslatableProp<SafeCategory, 'name', 'id'>('name', 'id'),

    cacheId: prop('id'),

    href: async (
      { id, url }: SafeCategory,
      _: any,
      { vtex: { tenant, binding }, clients: { catalog, rewriter } }: Context
    ) => {
      if (url == null) {
        const category = await getCategoryInfo(catalog, id, 4)

        url = category.url
      }

      const path = cleanUrl(url)

      // Won't translate href if current locale is the same as the default locale
      // or account isn't in the tenant system, or binding data isn't present
      return tenant && binding && binding.id && tenant.locale !== binding.locale
        ? (await rewriter.getRoute(
            id.toString(),
            getTypeForCategory(path),
            binding.id
          )) ?? path
        : path
    },

    metaTagDescription: formatTranslatableProp<
      SafeCategory,
      'MetaTagDescription',
      'id'
    >('MetaTagDescription', 'id'),

    titleTag: formatTranslatableProp<SafeCategory, 'Title', 'id'>(
      'Title',
      'id'
    ),

    slug: async (
      { name, id, url }: SafeCategory,
      _: any,
      { vtex: { tenant, binding }, clients: { catalog, rewriter } }: Context
    ) => {
      if (url == null) {
        const category = await getCategoryInfo(catalog, id, 4)

        url = category.url
      }

      // Won't translate slug if current locale is the same as the default locale
      // or account isn't in the tenant system, or binding data isn't present
      if (
        !tenant ||
        !binding ||
        tenant?.locale === binding?.locale ||
        !binding.id
      ) {
        return catalogSlugify(name).toLowerCase()
      }

      const translatedRoute =
        (await rewriter.getRoute(
          id.toString(),
          getTypeForCategory(cleanUrl(url)),
          binding.id
        )) ?? url

      return lastSegment(translatedRoute)
    },

    children: async (
      { id, children }: SafeCategory,
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
