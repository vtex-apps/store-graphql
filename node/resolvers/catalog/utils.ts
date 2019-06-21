import { compose, last, split, toLower } from 'ramda'
import { catalogSlugify, Slugify } from './slug'

export enum CatalogCrossSellingTypes {
  whoboughtalsobought = 'whoboughtalsobought',
  similars = 'similars',
  whosawalsosaw = 'whosawalsosaw',
  whosawalsobought = 'whosawalsobought',
  accessories = 'accessories',
  suggestions = 'suggestions',
}

const lastSegment = compose<string, string[], string>(
  last,
  split('/')
)

export function findCategoryInTree(
  tree: Category[],
  values: string[],
  index = 0
): Category | null {
  for (const node of tree) {
    const slug = lastSegment(node.url)
    if (slug.toUpperCase() === values[index].toUpperCase()) {
      if (index === values.length - 1) {
        return node
      }
      return findCategoryInTree(node.children, values, index + 1)
    }
  }
  return null
}

export const getBrandFromSlug = async (
  brandSlug: string,
  { clients: { catalog } }: Context
) => {
  const brands = await catalog.brands()
  return brands.find(
    brand =>
      toLower(catalogSlugify(brand.name)) === brandSlug ||
      toLower(Slugify(brand.name)) === brandSlug
  )
}

type CategoryMap = Record<string, Category>

/**
 * We are doing this because the `get category` API is not returning the values
 * for slug and href. So we get the whole category tree and get that info from
 * there instead until the Catalog team fixes this issue with the category API.
 */
export async function getCategoryInfo(
  catalog: Context['clients']['catalog'],
  id: number,
  levels: number
) {
  const categories = await catalog.categories(levels)
  const mapCategories = categories.reduce(appendToMap, {}) as CategoryMap

  const category = mapCategories[id] || { url: '' }

  return category
}

export function buildCategoryMap(categoryTree: Category[]) {
  return categoryTree.reduce(appendToMap, {}) as CategoryMap
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
