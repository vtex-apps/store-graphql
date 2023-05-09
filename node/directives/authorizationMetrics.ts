import { defaultFieldResolver, GraphQLField, GraphQLResolveInfo } from 'graphql'
import { SchemaDirectiveVisitor } from 'graphql-tools'

function checkForAuthorization(ctx: any, info: GraphQLResolveInfo) {
  const {
    request: {
      headers: {
        'user-agent': userAgent,
        'x-forwarded-for': forwardedFor,
        'x-forwarded-host': forwardedHost,
        'x-forwarded-path': forwardedPath,
        'x-vtex-caller': vtexCaller,
        origin,
        Authorization,
      },
    },
    vtex: { logger, adminUserAuthToken, storeUserAuthToken },
  } = ctx

  const vtexIdToken =
    ctx.cookies.get('VtexIdclientAutCookie') ?? ctx.get('VtexIdclientAutCookie')

  if (!vtexIdToken && Math.floor(Math.random() * 100) === 0) {
    logger.warn({
      message: 'Private route being accessed by unauthorized user',
      userAgent,
      forwardedFor,
      forwardedHost,
      forwardedPath,
      origin,
      vtexCaller,
      Authorization,
      adminUserAuthToken,
      storeUserAuthToken,
      queryName: info?.fieldName,
      queryParentType: info?.parentType.name,
      queryReturnType: info?.returnType.toString(),
    })
  }
}

export class AuthorizationMetrics extends SchemaDirectiveVisitor {
  public visitFieldDefinition(field: GraphQLField<any, any>) {
    const { resolve = defaultFieldResolver } = field

    field.resolve = async (root, args, ctx, info) => {
      checkForAuthorization(ctx, info)

      return resolve(root, args, ctx, info)
    }
  }
}
