import axios from 'axios'
import {withAuthToken} from '../headers'
import paths from '../paths'

export const resolveView = async (ioContext, product) => {
  const url = paths.crossSelling(ioContext.account, product.productId, 'whosawalsosaw')
  const {data} = await axios.get(url, { headers: withAuthToken()(ioContext) })
  return data
}

export const resolveBuy = async (ioContext, product) => {
  const url = paths.crossSelling(ioContext.account, product.productId, 'whoboughtalsobought')
  const {data} = await axios.get(url, { headers: withAuthToken()(ioContext) })
  return data
}
