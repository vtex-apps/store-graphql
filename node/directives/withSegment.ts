import { defaultFieldResolver, GraphQLField } from 'graphql'
import { SchemaDirectiveVisitor } from 'graphql-tools'
import atob from 'atob'

/**
 * Warning: we stopped using the segment client to decode the segment token for us because it added unnecessary overhead for now.
 * If the getSegment API evolves to do more than a decode we must stop decoding it here and start calling the API once again.
 */
export class WithSegment extends SchemaDirectiveVisitor {
  public visitFieldDefinition (field: GraphQLField<any, any>) {
    const {resolve = defaultFieldResolver} = field
    field.resolve = async (root, args, ctx: Context, info) => {
      const {vtex: {segmentToken}} = ctx
      ctx.vtex.segment = segmentToken ? JSON.parse(atob(segmentToken)) : undefined
      return resolve(root, args, ctx, info)
    }
  }
}
