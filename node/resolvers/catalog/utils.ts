import crypto from 'crypto'

import { compose, last, split, toLower } from 'ramda'

import { catalogSlugify, Slugify } from './slug'

// eslint-disable-next-line no-restricted-syntax
export enum CatalogCrossSellingTypes {
  whoboughtalsobought = 'whoboughtalsobought',
  similars = 'similars',
  whosawalsosaw = 'whosawalsosaw',
  whosawalsobought = 'whosawalsobought',
  accessories = 'accessories',
  suggestions = 'suggestions',
}

const pageTypeMapping: Record<string, string> = {
  Brand: 'brand',
  Department: 'department',
  Category: 'category',
  SubCategory: 'subcategory',
  NotFound: 'search',
  FullText: 'search',
  Search: 'search',
}

const lastSegment = compose<string, string[], string>(last, split('/'))

export function hashMD5(text: string) {
  const hash = crypto.createHash('md5')

  return hash.update(text).digest('hex')
}

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
  catalog: Context['clients']['catalog']
) => {
  const brands = await catalog.brands()

  return brands.find(
    (brand) =>
      brand.isActive &&
      (toLower(catalogSlugify(brand.name)) === brandSlug ||
        toLower(Slugify(brand.name)) === brandSlug)
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

export function translatePageType(catalogPageType: string): string {
  return pageTypeMapping[catalogPageType] || 'search'
}

interface CategoryArgs {
  department?: string
  category?: string
  subcategory?: string
}

const typesPossible = ['Department', 'Category', 'SubCategory']

export const searchContextGetCategory = async (
  args: CategoryArgs,
  catalog: Context['clients']['catalog'],
  isVtex: boolean,
  logger: Context['clients']['logger']
) => {
  if (!isVtex) {
    return getIdFromTree(args, catalog)
  }

  const { department, category, subcategory } = args

  if (!department && !category && !subcategory) {
    return null
  }

  const url = [department, category, subcategory]
    .filter(Boolean)
    .map((str) => catalogSlugify(str!))
    .join('/')

  const pageType = await catalog.pageType(url).catch(() => null)

  if (!pageType) {
    logger.info(
      `category ${url}, args ${JSON.stringify(args)}`,
      'pagetype-category-error'
    )
  }

  if (!pageType || !typesPossible.includes(pageType.pageType)) {
    return getIdFromTree(args, catalog)
  }

  return pageType.id
}

const getIdFromTree = async (
  args: CategoryArgs,
  catalog: Context['clients']['catalog']
) => {
  if (args.department) {
    const departments = await catalog.categories(3)

    const compareGenericSlug = ({
      entity,
      url,
    }: {
      entity: 'category' | 'department' | 'subcategory'
      url: string
    }) => {
      const slug = args[entity]

      if (!slug) {
        return false
      }

      return (
        url.endsWith(`/${toLower(catalogSlugify(slug))}`) ||
        url.endsWith(`/${toLower(Slugify(slug))}`)
      )
    }

    let found

    found = departments.find((department) =>
      compareGenericSlug({ entity: 'department', url: department.url })
    )

    if (args.category && found) {
      found = found.children.find((category) =>
        compareGenericSlug({ entity: 'category', url: category.url })
      )
    }

    if (args.subcategory && found) {
      found = found.children.find((subcategory) =>
        compareGenericSlug({ entity: 'subcategory', url: subcategory.url })
      )
    }

    return found ? found.id : null
  }

  return null
}
