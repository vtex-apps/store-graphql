import { defaultFieldResolver, GraphQLField } from 'graphql'
import { SchemaDirectiveVisitor } from 'graphql-tools'

function logRequest({ ctx, info, args }: { ctx: any; info: any; args: any }) {
  const {
    request: {
      headers: {
        'user-agent': userAgent,
        'x-forwarded-host': forwardedHost,
        'x-forwarded-path': forwardedPath,
        'x-vtex-caller': vtexCaller,
      },
    },
    vtex: { account, logger },
  } = ctx

  if (Math.floor(Math.random() * 100) <= 50) {
    logger.log({
      message: 'Old orders endpoint called',
      account,
      userAgent,
      forwardedHost,
      forwardedPath,
      vtexCaller,
      queryName: info?.fieldName,
      args,
    })
  }
}

export class MonitorOrigin extends SchemaDirectiveVisitor {
  public visitFieldDefinition(field: GraphQLField<any, any>) {
    const { resolve = defaultFieldResolver } = field

    field.resolve = async (root: any, args: any, ctx: any, info: any) => {
      try {
        return await resolve(root, args, ctx, info)
      } finally {
        logRequest({
          ctx,
          info,
          args,
        })
      }
    }
  }
}
