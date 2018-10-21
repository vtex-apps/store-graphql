import { defaultFieldResolver, GraphQLField } from 'graphql'
import { SchemaDirectiveVisitor } from 'graphql-tools'

export class Response extends SchemaDirectiveVisitor {
  public visitFieldDefinition (field: GraphQLField<any, any>) {
    const {resolve = defaultFieldResolver} = field
    field.resolve = async (root, args, ctx, info) => {
      const {vary = null} = this.args || {}
      if (typeof vary === 'string') {
        ctx.vary(vary)
      }
      return resolve(root, args, ctx, info)
    }
  }
}
