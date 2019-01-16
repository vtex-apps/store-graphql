import { defaultFieldResolver, GraphQLField } from 'graphql'
import { SchemaDirectiveVisitor } from 'graphql-tools'

import ResolverError from '../errors/resolverError'

const getSessionCurrentProfile = async (context) : Promise<CurrentProfile>  => {
  const { dataSources: { session } } = context

  const currentSession = await session.getSession()
  if(!currentSession.namespaces || !currentSession.namespaces.cookie['VtexIdclientAutCookie'])
    throw new ResolverError(`ERROR no session`, currentSession)
    
  const { namespaces: { profile: { email, id } } } = currentSession
  
  return {
    email: email.value,
    userId: id.value
  }
}

export class WithCurrentProfile extends SchemaDirectiveVisitor {
  public visitFieldDefinition (field: GraphQLField<any, any>) {
    const {resolve = defaultFieldResolver} = field
    field.resolve = async (root, args, ctx, info) => {
      const currentProfile = await getSessionCurrentProfile(ctx) 
      ctx.currentProfile = currentProfile
      
      return resolve(root, args, ctx, info)
    }
  }
}
