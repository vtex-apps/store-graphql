import axios from 'axios'
import {map, prop} from 'ramda'
import paths from '../paths'
import {resolveLocalProductFields} from './fieldsResolver'
import {withAuthToken} from '../headers'

export const resolveRecommendation = async (ioContext, product, type) => {
  const url = paths.crossSelling(ioContext.account, product.productId, type)
  const {data} = await axios.get(url, { headers: withAuthToken()(ioContext) })
  return map(resolveLocalProductFields, data)
}
