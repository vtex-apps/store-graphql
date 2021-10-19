import { parse as parseCookie } from 'cookie'
import { defaultFieldResolver, GraphQLField } from 'graphql'
import { SchemaDirectiveVisitor } from 'graphql-tools'
import jwtDecode from 'jwt-decode'
import { AuthenticationError, ResolverError } from '@vtex/api'

import { getSession } from '../resolvers/session/service'
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

      // If current profile doesn't exist, a new profile will be created. Don't need check it
      if (currentProfile) {
        await checkUserAccount(context, currentProfile)
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
  return getSession(context).then((currentSession) => {
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
    dataSources: { identity },
    clients: { profile },
    vtex: { adminUserAuthToken, storeUserAuthToken, account },
    request: {
      headers: { cookie },
    },
  } = context

  const parsedCookies = parseCookie(cookie || '')

  const userToken = storeUserAuthToken
  const adminToken = adminUserAuthToken

  if (userToken) {
    return identity
      .getUserWithToken({ token: userToken, account })
      .then((data) => {
        if (!data || data.account !== account || !data.id || !data.user) {
          return null
        }

        return { userId: data.id, email: data.user }
      })
  }

  if (!userToken && !!adminToken) {
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
      .getProfileInfo({ email: customerEmail, userId: '' })
      .then(({ email, userId }) => ({ email, userId }))
  }

  return null
}

async function validatedProfile(
  context: Context,
  currentProfile: CurrentProfile
): Promise<CurrentProfile> {
  const {
    clients: { profile },
  } = context

  const { id, userId } = (await profile
    .getProfileInfo(currentProfile, 'id')
    .catch(() => {})) || { id: '', userId: '' } // 404 case.

  if (!id) {
    // doesn't have a profile, create one
    return profile
      .createProfile({
        email: currentProfile.email,
        userId,
      })
      .then(({ profileId }: any) =>
        profile.getProfileInfo({ userId: profileId, email: '' })
      )
  }

  return { userId, email: currentProfile.email }
}

function isValidCallcenterOperator(context: Context, email: string) {
  const {
    clients: { callCenterOperator, licenseManager },
    vtex: { authToken },
  } = context

  return licenseManager
    .getAccountData(authToken)
    .then(({ id }: any) =>
      callCenterOperator.isValidCallcenterOperator({ email, accountId: id })
    )
}

function isLogged(currentProfile: CurrentProfile | null) {
  return currentProfile && currentProfile.email
}

async function checkUserAccount(context: Context, userProfile: CurrentProfile) {
  const {
    dataSources: { identity },
    vtex: { adminUserAuthToken, storeUserAuthToken, account },
  } = context

  if (!adminUserAuthToken && !storeUserAuthToken) {
    throw new AuthenticationError('')
  }

  const profile = await identity.getUserWithToken({
    token: storeUserAuthToken! ?? adminUserAuthToken!,
    account,
  })

  if (profile.account !== account || profile.user !== userProfile.email) {
    throw new AuthenticationError('')
  }
}
