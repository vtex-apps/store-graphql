import { defaultFieldResolver, GraphQLField } from 'graphql'
import { SchemaDirectiveVisitor } from 'graphql-tools'

import ResolverError from '../errors/resolverError'

const getSessionCurrentUser = async (context) => {
  const { dataSources: { session } } = context

  const currentSession = await session.getSession()
  if(!currentSession.namespaces || !currentSession.namespaces.cookie['VtexIdclientAutCookie'])
    throw new ResolverError(`ERROR no session`, currentSession)

  const { namespaces: { impersonate: { storeUserEmail }, authentication: { adminUserEmail } } } = currentSession

  return storeUserEmail && storeUserEmail.value || adminUserEmail.value
}

export class WithCurrentUser extends SchemaDirectiveVisitor {
  public visitFieldDefinition (field: GraphQLField<any, any>) {
    const {resolve = defaultFieldResolver} = field
    field.resolve = async (root, args, ctx, info) => {
      const currentUser = await getSessionCurrentUser(ctx) 
      ctx.currentUser = currentUser
      
      return resolve(root, args, ctx, info)
    }
  }
}
