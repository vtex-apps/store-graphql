import { GraphQLResolveInfo } from 'graphql'
import { map, toPairs, prop, zip } from 'ramda'

import { toIOMessage } from '../../utils/ioMessage'
import { pathToCategoryHref } from './category'
import { Slugify } from './slug'

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

const addSelected = (
  facets: any[],
  { query, map }: { query: string; map: string }
): any => {
  return facets.map((facet: any) => {
    let children = facet.Children

    if (children) {
      children = addSelected(children, { query, map })
    }

    const currentFacetSlug = decodeURIComponent(facet.Value).toLowerCase()

    const isSelected =
      zip(
        query
          .toLowerCase()
          .split('/')
          .map(str => Slugify(decodeURIComponent(str))),
        map.toLowerCase().split(',')
      ).find(
        ([slug, slugMap]) => slug === currentFacetSlug && facet.Map === slugMap
      ) !== undefined

    return {
      ...facet,
      Children: children,
      selected: isSelected,
    }
  })
}

export const resolvers = {
  Facet: {
    Name: (root: any, args: any, ctx: Context, info: GraphQLResolveInfo) =>
      resolvers.Facet.name(root, args, ctx, info),

    /**
     * TODO: Fix this last missing point for messages translations
     */
    name: ({ Name, Link }: any, _: any, {clients: {segment}}: Context, info: GraphQLResolveInfo) =>
      toIOMessage(segment, Name, `${info.parentType}-${info.fieldName}-${Link}`),

    id: prop('Id'),
    quantity: prop('Quantity'),
    link: prop('Link'),
    linkEncoded: prop('LinkEncoded'),
    slug: prop('Slug'),
    children: prop('Children'),
    map: prop('Map'),
    value: prop('Value'),

    href: ({Link}: {Link: string}) => {
      const [linkPath] = Link.split('?')
      return pathToCategoryHref(linkPath)
    }
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
