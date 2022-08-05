import { defaultFieldResolver, GraphQLField } from 'graphql'
import { SchemaDirectiveVisitor } from 'graphql-tools'

import { getOrderFormIdFromCookie } from '../utils'

export class WithOrderFormId extends SchemaDirectiveVisitor {
  public visitFieldDefinition(field: GraphQLField<any, any>) {
    const { resolve = defaultFieldResolver } = field

    field.resolve = async (root, args, ctx: Context, info) => {
      const checkoutOrderFormId = getOrderFormIdFromCookie(ctx.cookies)

      ctx.vtex.orderFormId = checkoutOrderFormId

      return resolve(root, args, ctx, info)
    }
  }
}
