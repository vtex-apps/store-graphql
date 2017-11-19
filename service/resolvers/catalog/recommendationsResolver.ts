import axios from 'axios'
import {map, prop} from 'ramda'
import paths from '../paths'
import {resolveLocalProductFields} from './fieldsResolver'

export const resolveView = async (account, product) => {
  const url = paths.crossSelling(account, product.productId, 'whosawalsosaw')
  const {data} = await axios.get(url)
  return map(resolveLocalProductFields, data)
}

export const resolveBuy = async (account, product) => {
  const url = paths.crossSelling(account, product.productId, 'whoboughtalsobought')
  const {data} = await axios.get(url)
  return map(resolveLocalProductFields, data)
}
