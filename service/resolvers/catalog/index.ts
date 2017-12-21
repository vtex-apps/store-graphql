import axios, {AxiosResponse} from 'axios'
import {IOContext} from 'colossus'
import {GraphqlRequestBody} from 'graphql'
import paths from '../paths'
import ResolverError from '../../errors/resolverError'
import {map, find, equals, prop, compose} from 'ramda'
import {resolveFacetFields, resolveProductFields, resolveCategoryFields, resolveBrandFields} from './fieldsResolver'
import {withAuthToken} from '../headers'

export default {
  autocomplete: async ({data}: GraphqlRequestBody, ioContext: IOContext) => {
    const url = paths.autocomplete(ioContext.account, data)
    const {data: resolvedAutocomplete} = await axios.get(url, { headers: withAuthToken()(ioContext) })

    return {resolvedAutocomplete}
  },

  facets: async ({data}: GraphqlRequestBody, ioContext: IOContext) => {
    const url = paths.facets(ioContext.account, data)
    const {data: facets} = await axios.get(url, { headers: withAuthToken()(ioContext) })
    const resolvedFacets = resolveFacetFields(facets)

    return {data: resolvedFacets}
  },

  product: async ({data, fields}: GraphqlRequestBody, ioContext: IOContext) => {
    const url = paths.product(ioContext.account, data)
    const {data: product} = await axios.get(url, { headers: withAuthToken()(ioContext) })
    const resolvedProduct = await resolveProductFields(ioContext, product, fields)

    return {data: resolvedProduct}
  },

  products: async ({data, fields}: GraphqlRequestBody, ioContext: IOContext) => {
    const url = paths.products(ioContext.account, data)
    const {data: products} = await axios.get(url, { headers: withAuthToken()(ioContext) })
    const resolvedProducts = await Promise.map(products, product => resolveProductFields(ioContext, product, fields))

    return {data: resolvedProducts}
  },

  brand: async ({data, fields, cookie}: GraphqlRequestBody, ioContext: IOContext) => {
    const url = paths.brand(ioContext.account)
    const {data: brands} = await axios.get(url, {headers: withAuthToken()(ioContext, cookie) })

    const brand = find(compose(equals(data.id), prop('id')), brands)
    if (!brand) {
      throw new ResolverError(`Brand with id ${data.id} not found`, 404)
    }
    return {data: resolveBrandFields(brand)}
  },

  category: async ({data, fields, cookie}: GraphqlRequestBody, ioContext: IOContext) => {
    const url = paths.category(ioContext.account, data)
    const {data: category} = await axios.get(url, {headers: withAuthToken()(ioContext, cookie) })
    return {data: resolveCategoryFields(category)}
  },

  categories: async ({data, fields}: GraphqlRequestBody, ioContext: IOContext) => {
    const url = paths.categories(ioContext.account, data)
    const {data: categories} = await axios.get(url, {headers: withAuthToken()(ioContext) })
    return {data: map(resolveCategoryFields, categories)}
  }
}
