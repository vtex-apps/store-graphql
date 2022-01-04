import { parse as parseCookie } from 'cookie'
import { defaultFieldResolver, GraphQLField, GraphQLResolveInfo } from 'graphql'
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

      // If the current profile doesn't exist, a new profile will be created, there is no need to check it
      if (currentProfile) {
        await checkUserAccount(context, currentProfile, info)
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
      .then((data) =>
        data && 'id' in data ? { userId: data.id, email: data.user } : null
      )
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

async function checkUserAccount(
  context: Context,
  userProfile: CurrentProfile,
  resolverInfo: GraphQLResolveInfo
) {
  const {
    dataSources: { identity },
    vtex: { adminUserAuthToken, storeUserAuthToken, account },
  } = context

  if (!adminUserAuthToken && !storeUserAuthToken) {
    throw new AuthenticationError('')
  }

  const tokenUser = await identity.getUserWithToken(
    storeUserAuthToken! ?? adminUserAuthToken!
  )

  if (tokenUser && 'id' in tokenUser && tokenUser.account !== account) {
    const {
      fieldName,
      returnType,
      operation: { operation, name },
    } = resolverInfo

    const {
      vtex: { logger, host },
      req: {
        headers: { 'user-agent': userAgent, referer },
      },
    } = context

    const logData = {
      host,
      referer,
      userAgent,
      message: 'Type: CrossTokenAccount',
      account,
      tokenAccount: tokenUser.account ?? '',
      caller: tokenUser.user ?? '',
      fieldName,
      fieldType: (returnType as any).name,
      operation: name?.value ? `${operation} ${name?.value}` : operation,
    }

    logger.warn(logData)
  }

  const isUserCallCenterOperator =
    'id' in tokenUser
      ? await isValidCallcenterOperator(context, tokenUser.user)
      : false

  if (
    tokenUser &&
    'id' in tokenUser &&
    !(
      tokenUser.account === account &&
      (isUserCallCenterOperator || tokenUser.user === userProfile.email)
    )
  ) {
    throw new AuthenticationError('')
  }
}
