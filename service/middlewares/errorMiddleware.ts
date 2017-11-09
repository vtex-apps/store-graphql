import {EndpointHandler} from 'colossus'
import {map} from 'ramda'

export default map((handler: EndpointHandler) => {
  return async (ctx) => {
    try {
      await handler(ctx)
    } catch (error) {
      ctx.set('Content-Type', 'application/json')
      ctx.status = error.statusCode || 500
      ctx.body = { error: error.message }
    }
  }
})
