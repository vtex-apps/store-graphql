import { compose, last, path, prop, split } from 'ramda'
import { toIOMessage } from '../../utils/ioMessage'

const lastSegment = compose<string, string[], string>(last, split('/'))

interface Category {
  id: string,
  url: string,
  name: string,
  children: Category[],
}

type CategoryMap = Record<string, Category>

const getCategoryInfo = async (catalog: any, id: string) => {
  const categories = await catalog.categories(3) as Category[]

  const mapCategories = categories.reduce((mapCategories: CategoryMap, department) => {
    mapCategories[department.id] = {
      ...department,
    }

    mapCategories = department.children.reduce((mapCategories: CategoryMap, category) => {
      mapCategories[category.id] = {
        ...category,
      }

      mapCategories = category.children.reduce((mapCategories, subCategory) => {
        mapCategories[subCategory.id] = {
          ...subCategory,
        }

        return mapCategories
      }, mapCategories)

      return mapCategories
    }, mapCategories)

    return mapCategories
  }, {}) as CategoryMap

  const category = mapCategories[id] || { url: '' }

  return category
}

function cleanUrl(url: string) {
  return url.replace(
    /https:\/\/[A-z0-9]+\.vtexcommercestable\.com\.br/,
    ''
  )
}

export const resolvers = {
  Category: {
    cacheId: prop('id'),

    href: async ({ id }: Category, _: any, { dataSources: { catalog } }: any) => {
      const category = await getCategoryInfo(catalog, id)

      const path = cleanUrl(category.url)

      const isDepartment = path.slice(1).indexOf('/') === -1
      if (isDepartment) {
        return path + '/d'
      }

      return path
    },

    metaTagDescription: prop('MetaTagDescription'),

    name: ({ name }: Category, _: any, ctx: Context) => toIOMessage(ctx, name, `category-${name}`),

    slug: async ({ id }: Category, _: any, { dataSources: { catalog } }: any) => {
      const category = await getCategoryInfo(catalog, id)

      return category.url ? lastSegment(category.url) : null
    },

    titleTag: prop('Title'),

    children: async ({ id }: any, _: any, { dataSources: { catalog } }: any) => {
      const category = await getCategoryInfo(catalog, id)

      return path(['children'], category)
    },
  },
}
