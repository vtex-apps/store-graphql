import { defaultFieldResolver, GraphQLField } from 'graphql'
import { SchemaDirectiveVisitor } from 'graphql-tools'
import cookies from 'cookie'

const CHECKOUT_COOKIE = 'checkout.vtex.com'
const getOrderFormIdFromCookie = (cookie: any): string | undefined => {
  const parsedCookie = cookies.parse(cookie)
  const chkCookie = parsedCookie[CHECKOUT_COOKIE]
  return chkCookie && chkCookie.split('=')[1]
}

export class WithOrderFormId extends SchemaDirectiveVisitor {
  public visitFieldDefinition (field: GraphQLField<any, any>) {
    const {resolve = defaultFieldResolver} = field
    field.resolve = async (root, args, ctx: Context, info) => {
      const { request: {headers: { cookie }} } = ctx
      const checkoutOrderFormId = getOrderFormIdFromCookie(cookie)
      ctx.vtex.orderFormId = checkoutOrderFormId
      return resolve(root, args, ctx, info)
    }
  }
}