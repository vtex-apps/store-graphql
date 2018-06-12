import axios from 'axios';
import { map } from 'ramda';

import { withAuthToken } from '../headers';
import paths from '../paths';
import { resolveLocalProductFields } from './fieldsResolver';

export const resolveView = async (ioContext, product) => {
  const url = paths.crossSelling(
    ioContext.account,
    product.productId,
    'whosawalsosaw'
  )
  const { data } = await axios.get(url, { headers: withAuthToken()(ioContext) })
  return map(resolveLocalProductFields, data)
}

export const resolveBuy = async (ioContext, product) => {
  const url = paths.crossSelling(
    ioContext.account,
    product.productId,
    'whoboughtalsobought'
  )
  const { data } = await axios.get(url, { headers: withAuthToken()(ioContext) })
  return map(resolveLocalProductFields, data)
}
