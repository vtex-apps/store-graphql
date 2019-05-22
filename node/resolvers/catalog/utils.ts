import { compose, last, split, toLower } from 'ramda'
import { catalogSlugify, Slugify } from './slug';
const lastSegment = compose<string, string[], string>(
  last,
  split('/')
)

export function findCategoryInTree(tree: Category[], values: string[], index = 0): Category | null {
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

export const getBrandFromSlug = async (brandSlug: string, {dataSources:{catalog}}: Context)  => {
  const brands = await catalog.brands()
  return brands.find(brand => 
    toLower(catalogSlugify(brand.name)) === brandSlug || toLower(Slugify(brand.name)) === brandSlug
  )
}
