import { parse as parseCookie } from 'cookie'
import { defaultFieldResolver, GraphQLField } from 'graphql'
import { SchemaDirectiveVisitor } from 'graphql-tools'
import jwtDecode from 'jwt-decode'

import ResolverError from '../errors/resolverError'
import { queries as sessionQueries } from '../resolvers/session'
import { SessionFields } from '../resolvers/session/sessionResolver'

export class WithCurrentProfile extends SchemaDirectiveVisitor {
  public visitFieldDefinition(field: GraphQLField<any, any>) {
    const { resolve = defaultFieldResolver } = field
    field.resolve = async (root, args, context, info) => {
      let currentProfile: any = null
      await getCurrentProfileFromSession(context)
        .then(profile => {
          currentProfile = profile
        })
        .catch(async _ => {
          currentProfile = await getCurrentProfileFromCookies(context)
        })
        .catch(_ => {
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

const getCurrentProfileFromSession = (
  context: Context
): Promise<CurrentProfile | null> => {
  return sessionQueries.getSession(null, null, context).then(currentSession => {
    const session = currentSession as SessionFields

    if (!session || !session.id) {
      throw new ResolverError(`ERROR no session`)
    }

    const profile =
      session.impersonate && session.impersonate.profile
        ? session.impersonate.profile
        : session.profile

    return profile
      ? ({
          email: profile && profile.email,
          userId: profile && profile.id,
        } as CurrentProfile)
      : null
  })
}

const getCurrentProfileFromCookies = async (
  context: Context
): Promise<CurrentProfile> => {
  const {
    dataSources: { profile, identity },
    vtex: { account },
    request: {
      headers: { cookie },
    },
  } = context

  const parsedCookies = parseCookie(cookie || '')

  const userToken = parsedCookies[`VtexIdclientAutCookie_${account}`]
  const adminToken = parsedCookies[`VtexIdclientAutCookie`]

  if (!!userToken) {
    return identity
      .getUserWithToken(userToken)
      .then(data => ({ userId: data.userId, email: data.user }))
  } else if (!userToken && !!adminToken) {
    const adminInfo = jwtDecode(adminToken)

    const callOpUserEmail = adminInfo && adminInfo.sub
    const isValidCallOp =
      callOpUserEmail &&
      (await isValidCallcenterOperator(context, callOpUserEmail))

    if (!isValidCallOp) {
      throw new ResolverError(`Unauthorized`, 401)
    }

    const customerEmail = parsedCookies['vtex-impersonated-customer-email']

    return profile
      .getProfileInfo(customerEmail)
      .then(({ email, userId }) => ({ email, userId }))
  }

  return null as any
}

const isValidCallcenterOperator = (context: Context, email: string) => {
  const {
    dataSources: { callcenterOperator, licenseManager },
  } = context

  return licenseManager
    .getAccountId()
    .then(id =>
      callcenterOperator.isValidCallcenterOperator({ email, accountId: id })
    )
}
