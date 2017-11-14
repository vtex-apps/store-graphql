import {json} from 'co-body'
import {EndpointHandler} from 'colossus'
import {GraphqlResolver} from 'graphql'
import {map} from 'ramda'

export default map((handler: GraphqlResolver) => {
  return async (ctx) => {
    const body = await json(ctx.request)
    const response = await handler(body, ctx.vtex)
    ctx.set('Content-Type', 'application/json')
    ctx.status = 200
    ctx.body = response
  }
})
