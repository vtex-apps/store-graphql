import { parse as parseCookie } from 'cookie'
import { defaultFieldResolver, GraphQLField } from 'graphql'
import { SchemaDirectiveVisitor } from 'graphql-tools'
import jwtDecode from 'jwt-decode'

import { AuthenticationError, ResolverError } from '@vtex/api'
import { queries as sessionQueries } from '../resolvers/session'
import { SessionFields } from '../resolvers/session/sessionResolver'

export class WithCurrentProfile extends SchemaDirectiveVisitor {
  public visitFieldDefinition(field: GraphQLField<any, any>) {
    const { resolve = defaultFieldResolver } = field
    field.resolve = async (root, args, context, info) => {
      const currentProfile: CurrentProfile | null = await getCurrentProfileFromSession(
        context
      )
        .catch(() => getCurrentProfileFromCookies(context))
        .catch(() => null)

      if (!isLogged(currentProfile)) {
        return null
      }

      context.vtex.currentProfile = await validatedProfile(
        context,
        currentProfile as CurrentProfile
      )

      return resolve(root, args, context, info)
    }
  }
}

function getCurrentProfileFromSession(
  context: Context
): Promise<CurrentProfile | null> {
  return sessionQueries.getSession(null, null, context).then(currentSession => {
    const session = currentSession as SessionFields

    if (!session || !session.id) {
      throw new ResolverError('Error fetching session data')
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

async function getCurrentProfileFromCookies(
  context: Context
): Promise<CurrentProfile | null> {
  const {
    dataSources: { profile, identity },
    vtex: { adminUserAuthToken, storeUserAuthToken },
    request: {
      headers: { cookie },
    },
  } = context
  const parsedCookies = parseCookie(cookie || '')

  const userToken = storeUserAuthToken
  const adminToken = adminUserAuthToken

  if (userToken) {
    return identity
      .getUserWithToken(userToken)
      .then(data => ({ userId: data.userId, email: data.user }))
  } else if (!userToken && !!adminToken) {
    const adminInfo = jwtDecode(adminToken) as any

    const callOpUserEmail = adminInfo && adminInfo.sub
    const isValidCallOp =
      callOpUserEmail &&
      (await isValidCallcenterOperator(context, callOpUserEmail))

    if (!isValidCallOp) {
      throw new AuthenticationError('User is not a valid callcenter operator')
    }

    const customerEmail = parsedCookies['vtex-impersonated-customer-email']

    return profile
      .getProfileInfo(customerEmail)
      .then(({ email, userId }) => ({ email, userId }))
  }

  return null
}

async function validatedProfile(
  context: Context,
  currentProfile: CurrentProfile
): Promise<CurrentProfile> {
  const {
    dataSources: { profile },
  } = context

  const { id, userId } = await profile.getProfileInfo(
    currentProfile.email,
    'id'
  )

  if (!id) {
    // doesn't have a profile, create one
    await profile.updateProfileInfo(currentProfile.email, {
      email: currentProfile.email,
      userId,
    })
  }

  return { userId, email: currentProfile.email }
}

function isValidCallcenterOperator(context: Context, email: string) {
  const {
    dataSources: { licenseManager },
    clients: { callCenterOperator },
  } = context

  return licenseManager
    .getAccountId()
    .then(id =>
      callCenterOperator.isValidCallcenterOperator({ email, accountId: id })
    )
}

function isLogged(currentProfile: CurrentProfile | null) {
  return currentProfile && currentProfile.email
}
