import { LINKED, MAX_AGE } from '@vtex/api'
import { runHttpQuery } from 'apollo-server-core'

export default async function run(ctx: Context, next: () => Promise<void>) {
  const {
    state: { query, schema },
    request: { method },
    request,
  } = ctx

  const {
    graphqlResponse,
    responseInit: { headers },
  } = await runHttpQuery([], {
    method,
    options: {
      cacheControl: {
        calculateHttpHeaders: true,
        defaultMaxAge: MAX_AGE.LONG,
      },
      context: ctx,
      debug: LINKED,
      schema,
      schemaHash: '' as any,
      tracing: true,
    },
    query,
    request,
  })

  ctx.body = graphqlResponse

  // Set Headers
  for (const [key, value] of Object.entries(headers ?? {})) {
    ctx.set(key, value)
  }

  ctx.set('cache-control', 'no-cache, no-store')

  await next()
}
