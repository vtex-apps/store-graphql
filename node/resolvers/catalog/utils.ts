import { compose, last, split, find, equals, toLower, prop } from 'ramda'
import { catalogSlugify } from './slug';
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
  return find<Brand>(
    compose(
      equals(brandSlug),
      toLower,
      catalogSlugify,
      prop('name') as any
    ),
    brands
  )
}
