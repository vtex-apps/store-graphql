import { defaultFieldResolver, GraphQLField } from 'graphql'
import { SchemaDirectiveVisitor } from 'graphql-tools'

import { getOwnerIdFromCookie } from '../utils'

export class WithOwnerId extends SchemaDirectiveVisitor {
  public visitFieldDefinition(field: GraphQLField<any, any>) {
    const { resolve = defaultFieldResolver } = field

    field.resolve = async (root: any, args: any, ctx: Context, info: any) => {
      const {
        vtex: { logger },
      } = ctx

      const OWNERSHIP_COOKIE = 'CheckoutOrderFormOwnership'

      logger.error(
        `Getting checkoutOwnerId: ${ctx.cookies.get(
          OWNERSHIP_COOKIE
        )}; Operation: ${field.name}`
      )
      const checkoutOwnerId = getOwnerIdFromCookie(ctx.cookies)

      ctx.vtex.ownerId = checkoutOwnerId

      return resolve(root, args, ctx, info)
    }
  }
}
