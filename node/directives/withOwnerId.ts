import { defaultFieldResolver, GraphQLField } from 'graphql'
import { SchemaDirectiveVisitor } from 'graphql-tools'

import { getOwnerIdFromCookie, getRcSessionIdFromCookie, getRcMacIdFromCookie } from '../utils'

export class WithOwnerId extends SchemaDirectiveVisitor {
  public visitFieldDefinition(field: GraphQLField<any, any>) {
    const { resolve = defaultFieldResolver } = field

    field.resolve = async (root: any, args: any, ctx: Context, info: any) => {
      ctx.vtex.ownerId = getOwnerIdFromCookie(ctx.cookies)
      ctx.vtex.rcSessionIdv7 = getRcSessionIdFromCookie(ctx.cookies)
      ctx.vtex.rcMacIdv7 = getRcMacIdFromCookie(ctx.cookies)

      return resolve(root, args, ctx, info)
    }
  }
}
