import { defaultFieldResolver, GraphQLField } from 'graphql'
import { SchemaDirectiveVisitor } from 'graphql-tools'

export class WithSegment extends SchemaDirectiveVisitor {
  public visitFieldDefinition (field: GraphQLField<any, any>) {
    const {resolve = defaultFieldResolver} = field
    field.resolve = async (root, args, ctx: Context, info) => {
      const {clients: {segment}} = ctx
      ctx.vtex.segment = await segment.getSegment()
      return resolve(root, args, ctx, info)
    }
  }
}
