import { appIdToAppAtMajor } from '@vtex/api'
import { defaultFieldResolver, GraphQLField } from 'graphql'
import { SchemaDirectiveVisitor } from 'graphql-tools'

const appAtMajor = appIdToAppAtMajor(process.env.VTEX_APP_ID!)

export interface Settings {
  checkoutCrossSite: boolean
}

export class WithSettings extends SchemaDirectiveVisitor {
  public visitFieldDefinition(field: GraphQLField<any, any>) {
    const { resolve = defaultFieldResolver } = field

    field.resolve = async (root: any, args: any, ctx: Context, info: any) => {
      try {
        const {
          clients: { apps },
        } = ctx

        ctx.settings = await apps.getAppSettings(appAtMajor)

        return resolve(root, args, ctx, info)
      } catch (error) {
        return resolve(root, args, ctx, info)
      }
    }
  }
}
