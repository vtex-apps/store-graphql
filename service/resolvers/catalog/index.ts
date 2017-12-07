import axios, {AxiosResponse} from 'axios'
import {IOContext} from 'colossus'
import {GraphqlRequestBody} from 'graphql'
import paths from '../paths'
import {resolveFacetFields, resolveProductFields} from './fieldsResolver'
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
  }
}
