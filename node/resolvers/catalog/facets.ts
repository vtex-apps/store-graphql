import { GraphQLResolveInfo } from 'graphql'
import { map, toPairs } from 'ramda'
import unorm from 'unorm'
import slugify from 'slugify'

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

const removeAccents = (name: string): string =>
  unorm.nfd(name).replace(/[\u0300-\u036f]/g, '')

const transformSlug = (name: string): string =>
  slugify(removeAccents(name)).replace('.', '-')

const formatCategoriesTree = (root: any) => {
  const format = (tree: any[] = []): any => {
    return tree.map(node => {
      return {
        ...node,
        Slug: transformSlug(node.Name),
        Children: format(node.Children),
      }
    })
  }

  return format(root)
}

const addSlugFromName = map((facet: any) => ({
  ...facet,
  Slug: transformSlug(facet.Name),
}))

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
        .includes(facet.Slug.toLowerCase()),
    }
  })
}

export const resolvers = {
  Facet: {
    Name: ({Name, Link}: any, _: any, ctx: Context, info: GraphQLResolveInfo) => toIOMessage(ctx, Name, `${info.parentType}-${info.fieldName}-${Link}`),
  },
  Facets: {
    Departments: ({ Departments = [], queryArgs = {} }: any) => {
      return addSelected(addSlugFromName(Departments), queryArgs)
    },
    Brands: ({ Brands = [], queryArgs = {} }: any) => {
      return addSelected(addSlugFromName(Brands), queryArgs)
    },
    SpecificationFilters: ({
      SpecificationFilters = {},
      queryArgs = {},
    }: any) => {
      const specificationFilters = map(
        specificationFilter => ({
          ...specificationFilter,
          facets: specificationFilter.facets.map((facet: any) => ({
            ...facet,
            Slug: facet.Name,
          })),
        }),
        objToNameValue('name', 'facets', SpecificationFilters)
      )

      return specificationFilters.map((specificationFilter: any) => ({
        ...specificationFilter,
        facets: addSelected(specificationFilter.facets, queryArgs),
      }))
    },
    CategoriesTrees: ({ CategoriesTrees = [], queryArgs = {} }: any) => {
      return addSelected(formatCategoriesTree(CategoriesTrees), queryArgs)
    },
  },
}
