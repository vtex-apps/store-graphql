import { defaultFieldResolver, GraphQLField } from 'graphql'
import { SchemaDirectiveVisitor } from 'graphql-tools'

export class WithSegment extends SchemaDirectiveVisitor {
  public visitFieldDefinition(field: GraphQLField<any, any>) {
    const { resolve = defaultFieldResolver } = field
    field.resolve = async (root, args, ctx, info) => {
      const {
        dataSources: { session },
        vtex: { segmentToken },
      } = ctx
      ctx.vtex.segment = !!segmentToken
        ? await session.getSegmentData()
        : undefined
      return resolve(root, args, ctx, info)
    }
  }
}
