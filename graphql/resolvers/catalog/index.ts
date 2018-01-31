import axios from 'axios'
import {ColossusContext} from 'colossus'
import {compose, equals, find, prop} from 'ramda'
import ResolverError from '../../errors/resolverError'
import {withAuthToken} from '../headers'
import paths from '../paths'

export default {
  autocomplete: async (_, data, {vtex: ioContext}: ColossusContext) => {
    const url = paths.autocomplete(ioContext.account, data)
    const {data: resolvedAutocomplete} = await axios.get(url, { headers: withAuthToken()(ioContext) })
    return resolvedAutocomplete
  },

  facets: async (_, data, {vtex: ioContext}: ColossusContext) => {
    const url = paths.facets(ioContext.account, data)
    const {data: facets} = await axios.get(url, { headers: withAuthToken()(ioContext) })
    return facets
  },

  product: async (_, data, {vtex: ioContext}: ColossusContext) => {
    const url = paths.product(ioContext.account, data)
    const {data: product} = await axios.get(url, { headers: withAuthToken()(ioContext) })
    return product
  },

  products: async (_, data, {vtex: ioContext}: ColossusContext) => {
    const url = paths.products(ioContext.account, data)
    const {data: products} = await axios.get(url, { headers: withAuthToken()(ioContext) })
    return products
  },

  brand: async (_, data, {vtex: ioContext, request: {headers: {cookie}}}: ColossusContext) => {
    const url = paths.brand(ioContext.account)
    const {data: brands} = await axios.get(url, {headers: withAuthToken()(ioContext, cookie) })

    const brand = find(compose(equals(data.id), prop('id')), brands)
    if (!brand) {
      throw new ResolverError(`Brand with id ${data.id} not found`, 404)
    }
    return brand
  },

  category: async (_, data, {vtex: ioContext, request: {headers: {cookie}}}: ColossusContext) => {
    const url = paths.category(ioContext.account, data)
    const {data: category} = await axios.get(url, {headers: withAuthToken()(ioContext, cookie) })
    return category
  },

  categories: async (_, data, {vtex: ioContext}: ColossusContext) => {
    const url = paths.categories(ioContext.account, data)
    const {data: categories} = await axios.get(url, {headers: withAuthToken()(ioContext) })
    return categories
  }
}
