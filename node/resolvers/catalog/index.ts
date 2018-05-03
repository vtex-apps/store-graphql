import axios, {AxiosResponse} from 'axios'
import {ColossusContext} from 'colossus'
import graphqlFields from 'graphql-fields'
import {compose, equals, head, find, map, prop, test} from 'ramda'
import ResolverError from '../../errors/resolverError'
import {withAuthToken} from '../headers'
import paths from '../paths'
import {resolveBrandFields, resolveCategoryFields, resolveFacetFields, resolveProductFields} from './fieldsResolver'

export default {
  autocomplete: async (_, data, {vtex: ioContext}: ColossusContext) => {
    const url = paths.autocomplete(ioContext.account, data)
    const {data: resolvedAutocomplete} = await axios.get(url, { headers: withAuthToken()(ioContext) })

    return resolvedAutocomplete
  },

  facets: async (_, data, {vtex: ioContext}: ColossusContext) => {
    const url = paths.facets(ioContext.account, data)
    const {data: facets} = await axios.get(url, { headers: withAuthToken()(ioContext) })
    const resolvedFacets = resolveFacetFields(facets)

    return resolvedFacets
  },

  product: async (_, data, {vtex: ioContext}: ColossusContext, info) => {
    const url = paths.product(ioContext.account, data)
    const {data: product} = await axios.get(url, { headers: withAuthToken()(ioContext) })
    const resolvedProduct = await resolveProductFields(ioContext, head(product), graphqlFields(info))

    return resolvedProduct
  },

  products: async (_, data, {vtex: ioContext}: ColossusContext, info) => {
    const queryTerm = data.query
    if (test(/[\?\=\,]/, queryTerm)) {
      throw new ResolverError(`The query term: '${queryTerm}' contains invalid characters.`, 500)
    }
    const url = paths.products(ioContext.account, data)
    const {data: products} = await axios.get(url, { headers: withAuthToken()(ioContext) })
    const fields = graphqlFields(info)
    const resolvedProducts = await Promise.map(products, product => resolveProductFields(ioContext, product, fields))

    return resolvedProducts
  },

  brand: async (_, data, {vtex: ioContext, request: {headers: {cookie}}}: ColossusContext) => {
    const url = paths.brand(ioContext.account)
    const {data: brands} = await axios.get(url, {headers: withAuthToken()(ioContext, cookie) })

    const brand = find(compose(equals(data.id), prop('id')), brands)
    if (!brand) {
      throw new ResolverError(`Brand with id ${data.id} not found`, 404)
    }
    return resolveBrandFields(brand)
  },

  brands: async (_, data, {vtex: ioContext, request: {headers: {cookie}}}: ColossusContext) => {
    const url = paths.brand(ioContext.account)
    const {data: brands} = await axios.get(url, {headers: withAuthToken()(ioContext, cookie) })
    return map(resolveBrandFields, brands)
  },

  category: async (_, data, {vtex: ioContext, request: {headers: {cookie}}}: ColossusContext) => {
    const url = paths.category(ioContext.account, data)
    const {data: category} = await axios.get(url, {headers: withAuthToken()(ioContext, cookie) })
    return resolveCategoryFields(category)
  },

  categories: async (_, data, {vtex: ioContext}: ColossusContext) => {
    const url = paths.categories(ioContext.account, data)
    const {data: categories} = await axios.get(url, {headers: withAuthToken()(ioContext) })
    return map(resolveCategoryFields, categories)
  }
}
