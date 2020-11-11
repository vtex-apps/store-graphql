import { defaultFieldResolver, GraphQLField } from 'graphql'
import { SchemaDirectiveVisitor } from 'graphql-tools'

import { flags } from '../utils/featureFlags'

export class ToVtexAssets extends SchemaDirectiveVisitor {
  public visitFieldDefinition(field: GraphQLField<any, any>) {
    const { resolve = defaultFieldResolver } = field

    field.resolve = async (root, args, ctx: Context, info) => {
      const result = resolve(root, args, ctx, info)

      return flags.VTEX_ASSETS_URL && result
        ? result.replace('vteximg.com.br', 'vtexassets.com')
        : result
    }
  }
}
