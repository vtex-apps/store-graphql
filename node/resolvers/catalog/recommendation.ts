import axios from 'axios'
import { ColossusContext } from 'colossus'
import { prop } from 'ramda'
import { withAuthToken } from '../headers'
import paths from '../paths'

export const resolvers = {
  Recommendation: {
    buy: ({productId}, _, ctx: ColossusContext) => axios.get(
      paths.crossSelling(ctx.vtex.account, productId, 'whoboughtalsobought'),
      {headers: withAuthToken()(ctx.vtex)}
    ).then(prop('data')),

    similars: ({productId}, _, ctx: ColossusContext) => axios.get(
      paths.crossSelling(ctx.vtex.account, productId, 'similars'),
      {headers: withAuthToken()(ctx.vtex)}
    ).then(prop('data')),

    view: ({productId}, _, ctx: ColossusContext) => axios.get(
      paths.crossSelling(ctx.vtex.account, productId, 'whosawalsosaw'),
      {headers: withAuthToken()(ctx.vtex)}
    ).then(prop('data')),
  }
}
