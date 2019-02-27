import { defaultFieldResolver, GraphQLField } from 'graphql'
import { SchemaDirectiveVisitor } from 'graphql-tools'

export class WithSegment extends SchemaDirectiveVisitor {
  public visitFieldDefinition (field: GraphQLField<any, any>) {
    const {resolve = defaultFieldResolver} = field
    field.resolve = async (root, args, ctx, info) => {
      const {dataSources: {session}} = ctx
      const segment = await session.getSegmentData()
      ctx.vtex.segment = segment
      return resolve(root, args, ctx, info)
    }
  }
}
