import { compose, last, path, prop, split } from 'ramda'
import { toIOMessage } from '../../utils/ioMessage'
import { CatalogDataSource } from '../../dataSources/catalog'

const lastSegment = compose<string, string[], string>(
  last,
  split('/')
)

interface Category {
  id: string
  url: string
  name: string
  children: Category[]
}

type CategoryMap = Record<string, Category>

/**
 * We are doing this because the `get category` API is not returning the values
 * for slug and href. So we get the whole category tree and get that info from
 * there instead until the Catalog team fixes this issue with the category API.
 */
async function getCategoryInfo(catalog: CatalogDataSource, id: string) {
  const LEVELS = ['department', 'category', 'subcategory']
  const categories = (await catalog.categories(LEVELS.length)) as Category[]

  const mapCategories = categories.reduce(appendToMap, {}) as CategoryMap

  const category = mapCategories[id] || { url: '' }

  return category
}

/**
 * That's a recursive function to fill an object like { [categoryId]: Category }
 * It will go down the category.children appending its children and so on.
 */
function appendToMap(mapCategories: CategoryMap, category: Category) {
  mapCategories[category.id] = category

  mapCategories = category.children.reduce(appendToMap, mapCategories)

  return mapCategories
}

function cleanUrl(url: string) {
  return url.replace(/https:\/\/[A-z0-9]+\.vtexcommercestable\.com\.br/, '')
}

export const resolvers = {
  Category: {
    cacheId: prop('id'),

    href: async (
      { id }: Category,
      _: any,
      { dataSources: { catalog } }: Context
    ) => {
      const category = await getCategoryInfo(catalog, id)

      const path = cleanUrl(category.url)

      // If the path is `/clothing`, we now that's a department
      // But if it is `/clothing/shirts`, it's not.
      const isDepartment = path.slice(1).indexOf('/') === -1
      if (isDepartment) {
        return path + '/d'
      }

      return path
    },

    metaTagDescription: prop('MetaTagDescription'),

    name: ({ name }: Category, _: any, {clients: {segment}}: Context) =>
      toIOMessage(segment, name, `category-${name}`),

    slug: async (
      { id }: Category,
      _: any,
      { dataSources: { catalog } }: Context
    ) => {
      const category = await getCategoryInfo(catalog, id)

      return category.url ? lastSegment(category.url) : null
    },

    titleTag: prop('Title'),

    children: async (
      { id }: Category,
      _: any,
      { dataSources: { catalog } }: Context
    ) => {
      const category = await getCategoryInfo(catalog, id)

      return path(['children'], category)
    },
  },
}
