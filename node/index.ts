import { Colossus } from '@vtex/api'
import { map } from 'ramda'

import { cache, dataSources } from './dataSources'
import { schemaDirectives } from './directives'
import { resolvers } from './resolvers'
import { catalogProxy } from './routes/catalogProxy'

const prepare = (handler) => async (ctx: ServiceContext) => {
  try {
    await handler(ctx)
  } catch (err) {
    const colossus = new Colossus(ctx.vtex)

    if (err.code && err.message && err.status) {
      ctx.status = err.status
      ctx.body = {
        code: err.code,
        message: err.message
      }
      colossus.sendLog('-', {
        code: err.code,
        message: err.message,
        path: ctx.originalPath,
        status: err.status,
      }, 'error')
      return
    }

    if (err.response) {
      ctx.status = err.response.status || 500
      ctx.body = ctx.status === 404 ? 'Not Found' : err.response.data
      console.log(
        `Error from HTTP request. ${err.response.config
          ? `method=${err.response.config.method} url=${
            err.response.config.url} `
          : ''} status=${err.response.status} data=${err.response.data}`,
      )
      const errorDetails = err.response.config
        ? {method: err.response.config.method, url: err.response.config.url}
        : {status: err.response.status, data: err.response.data}

      colossus.sendLog('-', errorDetails, 'error')
      return
    }

    colossus.sendLog('-', err, 'error')
    throw err
  }
}

export default {
  graphql: {
    cache,
    dataSources,
    resolvers,
    schemaDirectives
  },
  routes: map(prepare, {
    catalogProxy
  }),
}
