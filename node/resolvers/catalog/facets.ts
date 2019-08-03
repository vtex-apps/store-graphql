import { map, prop, toPairs, zip } from 'ramda'

import { toFacetProvider, toIOMessage } from '../../utils/ioMessage'
import { pathToCategoryHref } from './category'

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
          .map(decodeURIComponent),
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

const baseFacetResolvers = {
  quantity: prop('Quantity'),
  name: prop('Name'),
  link: prop('Link'),
  linkEncoded: prop('LinkEncoded'),
  map: prop('Map'),
  value: prop('Value')
}

export const resolvers = {
  FilterFacet: {
    ...baseFacetResolvers,

    name: async ({Map, Name}: any, _: any, { clients: { segment } }: Context) => {
      const [, id] = Map.split('_')
      const vrn = toFacetProvider(id)
      return toIOMessage(Name, segment, Name, vrn)
    },

    Name: (root: any, args: any, ctx: Context) => resolvers.FilterFacet.name(root, args, ctx),
  },
  DepartmentFacet: {
    ...baseFacetResolvers,

    id: prop('Id'),

    name: (root: any, args: any, ctx: Context) =>
      resolvers.CategoriesTreeFacet.name(root, args, ctx),

    Name: (root: any, args: any, ctx: Context) =>
      resolvers.CategoriesTreeFacet.name(root, args, ctx),
  },
  BrandFacet: {
    ...baseFacetResolvers,

    id: prop('Id'),
  },
  PriceRangesFacet: {
    ...baseFacetResolvers,

    slug: prop('Slug'),
  },
  CategoriesTreeFacet: {
    ...baseFacetResolvers,

    id: prop('Id'),

    children: prop('Children'),

    href: ({Link}: {Link: string}) => {
      const [linkPath] = Link.split('?')
      return pathToCategoryHref(linkPath)
    },

    name: ({Id, Name}: {Id: string, Name: string}, _: any, { clients: { segment } }: Context) =>
      toIOMessage('name', segment, Name, Id),

    Name: (root: any, args: any, ctx: Context) =>
      resolvers.CategoriesTreeFacet.name(root, args, ctx),
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
        clients: { catalog },
      } = ctx

      try {
        return catalog.productsQuantity(root.queryArgs)
      } catch (e) {
        return 0
      }
    },
  },
}
