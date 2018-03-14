import axios, {AxiosResponse} from 'axios'
import {ColossusContext} from 'colossus'
import graphqlFields from 'graphql-fields'
import {compose, equals, head, find, map, prop} from 'ramda'
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

  skus: async (_, data, {vtex: ioContext}: ColossusContext, info) => {
    const url = paths.productsBySku(ioContext.account, data)
    const response = await axios.get(url, { headers: withAuthToken()(ioContext) })
    const fields = graphqlFields(info)
    const resolvedProducts = await Promise.map(response.data, product => resolveProductFields(ioContext, product, fields))

    const [ resource, total ] = response.headers.resources.split('/')
    const [ start, end ] = resource.split('-')
    const perPage = data.to - data.from + 1

    return {
      items: resolvedProducts,
      paging: {
        total,
        perPage,
        pages: Math.ceil(total / perPage),
        page: Math.ceil(data.from / perPage) + 1,
        _from: data.from,
        _to: data.to,
      }
    }
  },

  products: async (_, data, {vtex: ioContext}: ColossusContext, info) => {
    const url = paths.products(ioContext.account, data)
    const response = await axios.get(url, { headers: withAuthToken()(ioContext) })
    const fields = graphqlFields(info)
    const resolvedProducts = await Promise.map(response.data, product => resolveProductFields(ioContext, product, fields))

    const [ resource, total ] = response.headers.resources.split('/')
    const [ start, end ] = resource.split('-')
    const perPage = data.to - data.from + 1

    return {
      items: resolvedProducts,
      paging: {
        total,
        perPage,
        pages: Math.ceil(total / perPage),
        page: Math.ceil(data.from / perPage) + 1,
        _from: data.from,
        _to: data.to,
      }
    }
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
