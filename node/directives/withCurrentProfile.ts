import { parse as parseCookie } from 'cookie'
import { defaultFieldResolver, GraphQLField, GraphQLResolveInfo } from 'graphql'
import { SchemaDirectiveVisitor } from 'graphql-tools'
import jwtDecode from 'jwt-decode'
import { AuthenticationError, ResolverError } from '@vtex/api'

import { getSession } from '../resolvers/session/service'
import { SessionFields } from '../resolvers/session/sessionResolver'
import { DefaultUser, User } from '../dataSources/identity'

type UserType = 'StoreUser' | 'CallCenterOperator'
interface ProfileInfos<ProfileType = CurrentProfile | null> {
  currentProfile: ProfileType
  userType?: UserType
  userData?: User | DefaultUser
}

export class WithCurrentProfile extends SchemaDirectiveVisitor {
  public visitFieldDefinition(field: GraphQLField<any, any>) {
    const { resolve = defaultFieldResolver } = field

    field.resolve = async (root, args, context, info) => {
      const profileInfos: ProfileInfos = await getCurrentProfileFromSession(
        context
      )
        .catch(() => {
          if (context.vtex.storeUserAuthToken) {
            return getStoreUserProfileFromCookie(context)
          }

          return getCurrentProfileFromCookies(context)
        })
        .catch(() => ({
          currentProfile: null,
        }))

      const { currentProfile } = profileInfos

      if (!isLogged(currentProfile)) {
        return null
      }

      // If the current profile doesn't exist, a new profile will be created, there is no need to check it
      if (profileInfos.currentProfile !== null) {
        await checkUserAccount(
          context,
          profileInfos as ProfileInfos<CurrentProfile>,
          info
        )
      }

      context.vtex.currentProfile = await validatedProfile(
        context,
        currentProfile as CurrentProfile
      )

      return resolve(root, args, context, info)
    }
  }
}

async function getCurrentProfileFromSession(
  context: Context
): Promise<ProfileInfos> {
  return getSession(context).then((currentSession) => {
    const session = currentSession as SessionFields

    if (!session || !session.id) {
      throw new ResolverError('Error fetching session data')
    }

    const profile = session?.impersonate?.profile ?? session.profile

    return {
      currentProfile: profile
        ? ({ email: profile.email, userId: profile.id } as CurrentProfile)
        : null,
      // If is impersonate is a call center op
      userType:
        session?.impersonate?.profile || session?.public?.impersonate
          ? 'CallCenterOperator'
          : 'StoreUser',
    }
  })
}

async function getStoreUserProfileFromCookie(
  context: Context
): Promise<ProfileInfos> {
  const {
    vtex: { storeUserAuthToken: userToken },
    dataSources: { identity },
  } = context

  return identity.getUserWithToken(userToken!).then((data) => {
    if (data && 'id' in data) {
      return {
        currentProfile: { userId: data.id, email: data.user },
        userData: data,
        userType: 'StoreUser',
      }
    }

    return { currentProfile: null }
  })
}

async function getCurrentProfileFromCookies(
  context: Context
): Promise<ProfileInfos> {
  const {
    clients: { profile },
    vtex: { adminUserAuthToken, storeUserAuthToken },
    request: {
      headers: { cookie },
    },
  } = context

  const parsedCookies = parseCookie(cookie || '')

  const userToken = storeUserAuthToken
  const adminToken = adminUserAuthToken

  if (!userToken && !!adminToken) {
    const adminInfo = jwtDecode(adminToken) as any

    const callOpUserEmail = adminInfo?.sub
    const isValidCallOp =
      callOpUserEmail &&
      (await isValidCallcenterOperator(context, callOpUserEmail))

    if (!isValidCallOp) {
      throw new AuthenticationError('User is not a valid callcenter operator')
    }

    const customerEmail = parsedCookies['vtex-impersonated-customer-email']

    return profile
      .getProfileInfo({ email: customerEmail, userId: '' }, context, undefined)
      .then(({ email, userId }) => ({
        currentProfile: { email, userId },
        userType: 'CallCenterOperator',
      }))
  }

  return { currentProfile: null }
}

async function validatedProfile(
  context: Context,
  currentProfile: CurrentProfile
): Promise<CurrentProfile> {
  const {
    clients: { profile },
  } = context

  const { id, userId } = (await profile
    .getProfileInfo(currentProfile, context, 'id')
    .catch(() => {})) || { id: '', userId: '' } // 404 case.

  if (id) {
    return { userId, email: currentProfile.email }
  }

  return profile
    .createProfile(
      {
        email: currentProfile.email,
        userId,
      } as Profile,
      context
    )
    .then((newProfile: Profile) =>
      profile.getProfileInfo(
        { userId: newProfile.userId, email: '' },
        context,
        undefined
      )
    )
}

async function isValidCallcenterOperator(context: Context, email: string) {
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
  return currentProfile?.email
}

async function checkUserAccount(
  context: Context,
  {
    currentProfile,
    userData: storeUser,
    userType,
  }: ProfileInfos<CurrentProfile>,
  resolverInfo: GraphQLResolveInfo
) {
  const {
    dataSources: { identity },
    vtex: { adminUserAuthToken, storeUserAuthToken, account },
  } = context

  if (!adminUserAuthToken && !storeUserAuthToken) {
    throw new AuthenticationError('')
  }

  let tokenUser = storeUser

  if (!tokenUser) {
    tokenUser = await identity.getUserWithToken(
      storeUserAuthToken! ?? adminUserAuthToken!
    )
  }

  if (tokenUser && 'account' in tokenUser && tokenUser.account !== account) {
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

  // If has admin user auth token, off course is a call center operator
  const isUserCallCenterOperator = userType === 'CallCenterOperator'

  if (
    tokenUser &&
    'id' in tokenUser &&
    !(
      tokenUser.account === account &&
      (isUserCallCenterOperator || tokenUser.user === currentProfile?.email)
    )
  ) {
    throw new AuthenticationError('')
  }
}
