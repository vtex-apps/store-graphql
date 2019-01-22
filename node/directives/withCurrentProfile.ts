import { parse as parseCookie } from 'cookie'
import { defaultFieldResolver, GraphQLField } from 'graphql'
import { SchemaDirectiveVisitor } from 'graphql-tools'
import { head, pickBy, values } from 'ramda'
import jwtDecode from 'jwt-decode' 

import ResolverError from '../errors/resolverError'

export class WithCurrentProfile extends SchemaDirectiveVisitor {
  public visitFieldDefinition (field: GraphQLField<any, any>) {
    const { resolve = defaultFieldResolver } = field
    field.resolve = async (root, args, context, info) => {
      await getCurrentProfileFromSession(context).then(( currentProfile ) => {
        context.currentProfile = currentProfile
      }).catch(async () => {
        context.currentProfile = await getCurrentProfileFromCookies(context)
      })

      return resolve(root, args, context, info)
    }
  }
}

const getCurrentProfileFromSession = (context: Context) : Promise<CurrentProfile>  => {
  const { dataSources: { session } } = context

  return session.getSession().then( ( currentSession ) => {
    if (currentSession.namespaces) {
      const { namespaces: { profile: { email, id } } } = currentSession

      return {
        email: email.value,
        userId: id.value
      }
    }

    throw new ResolverError(`ERROR no session`, currentSession)
  })
}

const getCurrentProfileFromCookies = async (context: Context) : Promise<CurrentProfile> => {
  const { dataSources: { profile, identity }, vtex: { account }, request: { headers: { cookie } } } = context

  const parsedCookies = parseCookie(cookie || '')

  const startsWithVtexIdAccount = (val, key) => key.startsWith(`VtexIdclientAutCookie_${account}`)
  const userToken = head(values(pickBy(startsWithVtexIdAccount, parsedCookies)))

  if (!userToken) {
    const startsWithVtexId = (val, key) => key.startsWith(`VtexIdclientAutCookie`) 
    const adminTokenJWT = head(values(pickBy(startsWithVtexId, parsedCookies)))
    const adminInfo =  jwtDecode(adminTokenJWT)

    const teleUserEmail = adminInfo && adminInfo.sub  
    const isValidTele = teleUserEmail && await isValidTelemarketing(context, teleUserEmail)

    if(!isValidTele) throw new ResolverError(`Unauthorized`, 401)

    const customerEmail = parsedCookies['vtex-impersonated-customer-email']

    return profile.getProfileInfo(customerEmail).then(({ email, userId }) => ({ email, userId }))
  }

  return identity.getUserWithToken(userToken).then((data) => ({ userId: data.userId, email: data.user }))
}

const isValidTelemarketing = (context: Context, email: string) => {
  const { dataSources: { telemarketing, licenseManager} } = context

  return licenseManager.getAccountId().then((id) => telemarketing.isValidTelemarketing({ email, accountId: id }))
}

