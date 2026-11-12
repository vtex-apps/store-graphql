import { UserInputError } from '@vtex/api'
import { path } from 'ramda'
import validator from 'validator'
import { MutationSaveAddressArgs } from 'vtex.store-graphql'

import type { DefaultUser, User } from '../../clients/identity'
import { ProfileNotFoundError } from '../../clients/profile/errors'
import { incrementCounter } from '../../utils/metrics'
import fieldR from './fieldResolvers'
import {
  createAddress,
  deleteAddress,
  getProfile,
  updateAddress,
  updateProfile,
  updateProfilePicture,
  saveAddress,
} from './services'

const TRUE = 'True'
const FALSE = 'False'

interface CheckUserAuthorizationParams {
  context: Context
  email: string
}

const isIdentityOutage = (e: any) => {
  const status = e?.response?.status

  return !e?.response || status >= 500 || status === 408 || status === 429
}

const checkUserAuthorization = async ({
  context,
  email,
}: CheckUserAuthorizationParams): Promise<boolean> => {
  const {
    vtex: { storeUserAuthToken, account },
    clients: { identity },
  } = context

  let validUser = !!storeUserAuthToken

  const tokenUser = (storeUserAuthToken
    ? await identity.getUserWithToken(storeUserAuthToken).catch((e) => {
        if (isIdentityOutage(e)) {
          throw e
        }

        return { authStatus: '' } as DefaultUser
      })
    : { authStatus: '' }) as DefaultUser | User

  validUser =
    validUser &&
    Boolean(tokenUser) &&
    'id' in tokenUser &&
    tokenUser.account === account &&
    tokenUser.user.length === email.length

  for (let i = 0; i < email.length; i++) {
    if (validUser && email[i] !== (tokenUser as User)?.user?.[i]) {
      validUser = false
    }
  }

  return validUser
}

const normalizeEmail = (email?: string | null) => {
  const normalized = (email ?? '').trim()

  if (!validator.isEmail(normalized) || /[/\\?#%\s]/.test(normalized)) {
    incrementCounter('subscribe_newsletter_total', { outcome: 'invalid_email' })

    throw new UserInputError('Invalid email')
  }

  return normalized
}

interface SubscribeNewsletterArgs {
  email?: string | null
  fields?: {
    name?: string
    phone?: string
    bindingUrl?: string
    bindingId?: string
  }
  isNewsletterOptIn: boolean
}

export const mutations = {
  createAddress: (_: any, { fields }: any, context: Context) =>
    createAddress(context, fields),

  saveAddress: (_: void, args: MutationSaveAddressArgs, context: Context) =>
    saveAddress(context, args),

  deleteAddress: (_: any, { id }: any, context: Context) =>
    deleteAddress(context, id),

  updateAddress: (_: any, args: any, context: Context) =>
    updateAddress(context, args),

  updateProfile: (_: any, { fields, customFields }: any, context: Context) =>
    updateProfile(context, fields, customFields),

  updateProfilePicture: (_: any, __: any, context: Context) =>
    updateProfilePicture('updateProfilePicture', context),

  uploadProfilePicture: (_: any, __: any, context: Context) =>
    updateProfilePicture('uploadProfilePicture', context),

  subscribeNewsletter: async (
    _: any,
    { email: rawEmail, fields, isNewsletterOptIn }: SubscribeNewsletterArgs,
    context: Context
  ) => {
    const email = normalizeEmail(rawEmail)
    const { profile } = context.clients
    const optIn =
      isNewsletterOptIn === undefined || isNewsletterOptIn === true
        ? TRUE
        : FALSE

    const updatedPersonalPreferences: PersonalPreferences = {
      isNewsletterOptIn: optIn,
    }

    const userProfile = await profile
      .getProfileInfo({ email, userId: '' }, context, undefined)
      .catch((e) => {
        if (e?.response?.status === 404) {
          return {}
        }

        incrementCounter('subscribe_newsletter_total', {
          outcome: 'read_error',
        })
        context.vtex.logger.warn({
          message: 'subscribeNewsletter profile read failed',
          status: e?.response?.status,
          code: e?.code,
        })
        throw e
      })

    // `fields` are only persisted by the V1 profile client
    if (fields) {
      const { name, phone, bindingId, bindingUrl } = fields

      const userHasFirstName = Boolean(userProfile.firstName)
      const userHasPhone = Boolean(userProfile.cellPhone)
      const userHasBindingId = Boolean(userProfile.bindingId)
      const userHasBindingUrl = Boolean(userProfile.bindingUrl)

      // Prevents 'firstName' field from being overridden.
      if (!userHasFirstName && name) {
        updatedPersonalPreferences.firstName = name
      }

      // Prevents 'homePhone' field from being overridden.
      if (!userHasPhone && phone) {
        updatedPersonalPreferences.homePhone = phone
      }

      // Prevents 'bindingId' field from being overridden.
      if (!userHasBindingId && bindingId) {
        updatedPersonalPreferences.bindingId = bindingId
      }

      // Prevents 'bindingUrl' field from being overridden.
      if (!userHasBindingUrl && bindingUrl) {
        updatedPersonalPreferences.bindingUrl = bindingUrl
      }
    }

    let updateData = true

    if (userProfile.createdIn || userProfile.id) {
      updateData = await checkUserAuthorization({
        context,
        email,
      }).catch((e) => {
        incrementCounter('subscribe_newsletter_total', {
          outcome: 'identity_error',
        })
        context.vtex.logger.warn({
          message: 'subscribeNewsletter identity check failed',
          status: e?.response?.status,
          code: e?.code,
        })
        throw e
      })
    }

    if (!updateData) {
      incrementCounter('subscribe_newsletter_total', { outcome: 'not_owner' })

      return true
    }

    const stored = await profile
      .updatePersonalPreferences(
        { email, userId: '' },
        updatedPersonalPreferences,
        context,
        userProfile
      )
      .then(() => true)
      .catch((e) => {
        if (e instanceof ProfileNotFoundError) {
          incrementCounter('subscribe_newsletter_total', {
            outcome: 'no_profile',
          })

          return false
        }

        incrementCounter('subscribe_newsletter_total', {
          outcome:
            e instanceof UserInputError ? 'user_input_error' : 'write_error',
        })
        throw e
      })

    if (stored) {
      incrementCounter('subscribe_newsletter_total', { outcome: 'ok' })
    }

    return true
  },
}

export const queries = {
  profile: (_: any, { customFields }: any, context: Context) =>
    getProfile(context, customFields),

  checkProfileAllowed: async (_: any, __: any, context: Context) => {
    const {
      clients: { catalog, customSession },
      vtex: { segment },
      cookies,
    } = context

    const salesChannel = segment ? segment.channel : null

    const { sessionData } = await customSession.getSession(
      cookies.get('vtex_session')!,
      ['*']
    )

    const email: string | undefined = path(
      ['namespaces', 'profile', 'email', 'value'],
      sessionData
    )

    const availableSalesChannels = await catalog
      .salesChannelAvailable(email)
      .catch(() => [])

    // Checking with `==` since `sc.Id` is an Integer and salesChannel a string
    // eslint-disable-next-line eqeqeq
    const available = availableSalesChannels.find((sc) => sc.Id == salesChannel)

    return {
      allowed: Boolean(available),
      condition: available
        ? 'authorized'
        : email
        ? 'forbidden' // The user is logged in and not allowed
        : 'unauthorized', // We don't know the user identity
    }
  },
}

export const fieldResolvers = fieldR
