import { parse as parseCookie } from 'cookie'
import { defaultFieldResolver, GraphQLField } from 'graphql'
import { SchemaDirectiveVisitor } from 'graphql-tools'
import jwtDecode from 'jwt-decode'

import ResolverError from '../errors/resolverError'

export class WithCurrentProfile extends SchemaDirectiveVisitor {
  public visitFieldDefinition (field: GraphQLField<any, any>) {
    const { resolve = defaultFieldResolver } = field
    field.resolve = async (root, args, context, info) => {
      let currentProfile = null
      await getCurrentProfileFromSession(context).then(( profile ) => {
        currentProfile = profile
      }).catch(async (_) => {
        currentProfile = await getCurrentProfileFromCookies(context)
      }).catch(_ => {
        currentProfile = null
      })

      if (!currentProfile || !currentProfile.email) {
        return null
      }

      context.vtex.currentProfile = currentProfile

      return resolve(root, args, context, info)
    }
  }
}

const getCurrentProfileFromSession = (context: Context) : Promise<CurrentProfile>  => {
  const { dataSources: { session } } = context

  return session.getSession().then( ( currentSession ) => {
    if (currentSession.namespaces) {
      const { namespaces: { profile } } = currentSession
      const { email = null, id = null } = profile || {}

      return {
        email: email && email.value,
        userId: id && id.value
      }
    }

    throw new ResolverError(`ERROR no session`, currentSession)
  })
}

const getCurrentProfileFromCookies = async (context: Context) : Promise<CurrentProfile> => {
  const { dataSources: { profile, identity }, vtex: { account }, request: { headers: { cookie } } } = context

  const parsedCookies = parseCookie(cookie || '')

  const userToken = parsedCookies[`VtexIdclientAutCookie_${account}`]
  const adminToken = parsedCookies[`VtexIdclientAutCookie`]

  if (!!userToken) {
    return identity.getUserWithToken(userToken).then((data) => ({ userId: data.userId, email: data.user }))
  }
  else if (!userToken && !!adminToken) {
    const adminInfo = jwtDecode(adminToken)

    const callOpUserEmail = adminInfo && adminInfo.sub
    const isValidCallOp = callOpUserEmail && await isValidCallcenterOperator(context, callOpUserEmail)

    if (!isValidCallOp) {
      throw new ResolverError(`Unauthorized`, 401)
    }

    const customerEmail = parsedCookies['vtex-impersonated-customer-email']

    return profile.getProfileInfo(customerEmail).then(({ email, userId }) => ({ email, userId }))
  }

  return null
}

const isValidCallcenterOperator = (context: Context, email: string) => {
  const { dataSources: { callcenterOperator, licenseManager} } = context

  return licenseManager.getAccountId().then((id) => callcenterOperator.isValidCallcenterOperator({ email, accountId: id }))
}

