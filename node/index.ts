import { Logger } from '@vtex/api'
import { map } from 'ramda'

import { cache, dataSources } from './dataSources'
import { schemaDirectives } from './directives'
import { resolvers } from './resolvers'
import { catalogProxy } from './routes/catalogProxy'

const prepare = (handler) => async (ctx: Context) => {
  try {
    await handler(ctx)
  } catch (err) {
    console.log('Error in proxy', err)
    const logger = new Logger(ctx.vtex)

    ctx.set('Cache-Control', 'no-cache, no-store')

    if (err.code && err.message && err.status) {
      ctx.status = err.status
      ctx.body = {
        code: err.code,
        message: err.message
      }
      const details = {
        path: ctx.originalPath,
        status: err.status,
      }
      logger.error(err, details)
      return
    }

    logger.error(err)

    if (err.response) {
      ctx.status = err.response.status || 500
      ctx.body = ctx.status === 404 ? 'Not Found' : err.response.data
      console.log(
        `Error from HTTP request. ${err.response.config
          ? `method=${err.response.config.method} url=${
            err.response.config.url} `
          : ''} status=${err.response.status} data=${err.response.data}`,
      )
      return
    }

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
