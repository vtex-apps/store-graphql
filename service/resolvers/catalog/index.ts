import {headers, withAuthToken} from '../headers'
import httpResolver from '../httpResolver'
import paths from '../paths'
import productsResolver from './productsResolver'
import recommendationsResolver from './recommendationsResolver'
import specificationResolver from './specificationResolver'

export default {
  attachmentDomainValues: async (body) => (
    {data: JSON.parse(body.root.domainValues)}
  ),

  autocomplete: httpResolver({
    url: paths.autocomplete,
  }),

  brand: httpResolver({
    headers: headers.facade,
    url: paths.brand,
  }),

  categories: httpResolver({
    headers: headers.facade,
    url: paths.categories,
  }),

  category: httpResolver({
    headers: headers.facade,
    url: paths.category,
  }),

  facets: httpResolver({
    headers: headers.facade,
    url: paths.facets,
  }),

  facetsSpecificationFilters: async (body) => {
    const { SpecificationFilters } = body.root
    const builtFilters = (Object.getOwnPropertyNames(SpecificationFilters).map(name => ({
      facets: SpecificationFilters[name],
      name,
    })) || [])
    return ({data: builtFilters })
  },

  product: httpResolver({
    headers: headers.facade,
    url: paths.product,
  }),

  productClusterHighlights: async (body) => (
    {data: (Object.getOwnPropertyNames(body.root.clusterHighlights).map(id => ({id, name: body.root.clusterHighlights[id]})) || [])}
  ),

  productProperties: specificationResolver('allSpecifications'),

  productPropertyGroups: async (body) => {
    const root = Object.assign({}, body.root)
    delete root.productId
    delete root.productName
    delete root.brand
    delete root.link
    delete root.linkText
    delete root.productReference
    delete root.items
    delete root.categoryId
    delete root.categories
    delete root.categoriesIds
    delete root.clusterHighlights
    delete root.description
    if (root.allSpecifications) {
      for (const spec of root.allSpecifications) {
        delete root[spec]
      }
    }
    delete root.allSpecifications

    const names = Object.getOwnPropertyNames(root).map(name => ({name, properties: body.root[name]})) || []
    return {data: names}
  },

  productRecommendations: recommendationsResolver,

  products: productsResolver({
    headers: headers.facade,
    url: paths.products,
  }),

  skuVariations: specificationResolver('variations'),
}
