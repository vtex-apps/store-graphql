import { GraphQLResolveInfo } from 'graphql'
import { map, toPairs } from 'ramda'
import unorm from 'unorm'

import { toIOMessage } from '../../utils/ioMessage'

const objToNameValue = (
  keyName: string,
  valueName: string,
  record: Record<string, any>
) =>
  map(
    ([key, value]) => ({ [keyName]: key, [valueName]: value }),
    toPairs(record)
  )

const formatCategoriesTree = (root: any) => {
  const format = (tree: any[] = [], parentPath = '', level = 0): any => {
    if (tree.length === 0) {
      return []
    }

    return tree.reduce((categories, node) => {
      // Remove the accents and diacritics of the string
      const normalizedName = unorm
        .nfd(node.Name)
        .replace(/[\u0300-\u036f]/g, '')
      const nodePath = parentPath
        ? `${parentPath}/${normalizedName}`
        : normalizedName
      return [
        ...categories,
        {
          Id: node.Id,
          Slug: node.Slug && node.Slug.replace(',', ''),
          Quantity: node.Quantity,
          Name: node.Name,
          Link: node.Link,
          path: nodePath,
          level,
        },
        ...format(node.Children, nodePath, level + 1),
      ]
    }, [])
  }

  return format(root)
}

export const resolvers = {
  Facet: {
    Name: ({Name, Link}: any, _: any, ctx: Context, info: GraphQLResolveInfo) => toIOMessage(ctx, Name, `${info.parentType}-${info.fieldName}-${Link}`),
    selected: () => false,
  },
  Facets: {
    SpecificationFilters: ({ SpecificationFilters = {} }) =>
      objToNameValue('name', 'facets', SpecificationFilters),
  },
}
