import axios, {AxiosResponse} from 'axios'
import {IOContext} from 'colossus'
import {GraphqlRequestBody} from 'graphql'
import paths from '../paths'
import {resolveFacetFields, resolveProductFields} from './fieldsResolver'

export default {
  autocomplete: async ({data}: GraphqlRequestBody, {account}: IOContext) => {
    const url = paths.autocomplete(account, data)
    const {data: resolvedAutocomplete} = await axios.get(url)

    return {resolvedAutocomplete}
  },

  facets: async ({data}: GraphqlRequestBody, {account}: IOContext) => {
    const url = paths.facets(account, data)
    const {data: facets} = await axios.get(url)
    const resolvedFacets = resolveFacetFields(facets)

    return {data: resolvedFacets}
  },

  product: async ({data, fields}: GraphqlRequestBody, {account}: IOContext) => {
    const url = paths.product(account, data)
    const {data: product} = await axios.get(url)
    const resolvedProduct = await resolveProductFields(account, product, fields)

    return {data: resolvedProduct}
  },

  products: async ({data, fields}: GraphqlRequestBody, {account}: IOContext) => {
    const url = paths.products(account, data)
    const {data: products} = await axios.get(url)
    const resolvedProducts = await Promise.map(products, product => resolveProductFields(account, product, fields))

    return {data: resolvedProducts}
  }
}
