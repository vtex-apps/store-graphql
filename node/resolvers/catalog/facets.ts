import { GraphQLResolveInfo } from 'graphql'
import { map, toPairs, prop } from 'ramda'

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
  const format = (tree: any[] = []): any => {
    return tree.map(node => {
      return {
        ...node,
        Children: format(node.Children),
      }
    })
  }

  return format(root)
}

const addSelected = (facets: any[], { query }: { query: string }): any => {
  return facets.map((facet: any) => {
    let children = facet.Children

    if (children) {
      children = addSelected(children, { query })
    }

    return {
      ...facet,
      Children: children,
      selected: query
        .toLowerCase()
        .split('/')
        .includes(facet.Value.toLowerCase()),
    }
  })
}

export const resolvers = {
  Facet: {
    Name: (
      { Name, Link }: any,
      _: any,
      ctx: Context,
      info: GraphQLResolveInfo
    ) => toIOMessage(ctx, Name, `${info.parentType}-${info.fieldName}-${Link}`),
    name: (root: any, args: any, ctx: Context, info: GraphQLResolveInfo) => {
      return resolvers.Facet.Name(root, args, ctx, info)
    },

    id: prop('Id'),
    quantity: prop('Quantity'),
    link: prop('Link'),
    slug: prop('Slug'),
    children: prop('Children'),
    map: prop('Map'),
    value: prop('Value'),
  },
  Facets: {
    Departments: ({ Departments = [], queryArgs = {} }: any) => {
      return addSelected(Departments, queryArgs)
    },
    departments: (root: any) => {
      return resolvers.Facets.Departments(root)
    },

    Brands: ({ Brands = [], queryArgs = {} }: any) => {
      return addSelected(Brands, queryArgs)
    },
    brands: (root: any) => {
      return resolvers.Facets.Brands(root)
    },

    SpecificationFilters: ({
      SpecificationFilters = {},
      queryArgs = {},
    }: any) => {
      const specificationFilters = objToNameValue(
        'name',
        'facets',
        SpecificationFilters
      )

      return specificationFilters.map((specificationFilter: any) => ({
        ...specificationFilter,
        facets: addSelected(specificationFilter.facets, queryArgs),
      }))
    },
    specificationFilters: (root: any) => {
      return resolvers.Facets.SpecificationFilters(root)
    },

    CategoriesTrees: ({ CategoriesTrees = [], queryArgs = {} }: any) => {
      return addSelected(formatCategoriesTree(CategoriesTrees), queryArgs)
    },
    categoriesTrees: (root: any) => {
      return resolvers.Facets.CategoriesTrees(root)
    },

    priceRanges: prop('PriceRanges'),

    recordsFiltered: async (root: any, _: any, ctx: Context) => {
      const {
        dataSources: { catalog },
      } = ctx

      try {
        return catalog.productsQuantity(root.queryArgs)
      } catch (e) {
        return 0
      }
    },
  },
}
