import fieldR from './fieldResolvers'
import {
  createAddress,
  deleteAddress,
  getProfile,
  updateAddress,
  updateProfile,
  updateProfilePicture,
} from './services'
import { path } from 'ramda'

const TRUE = 'True'
const FALSE = 'False'

interface SubscribeNewsletterArgs {
  email: string
  isNewsletterOptIn: boolean
}

export const mutations = {
  createAddress: (_: any, { fields }: any, context: Context) =>
    createAddress(context, fields),

  deleteAddress: (_: any, { id }: any, context: Context) =>
    deleteAddress(context, id),

  updateAddress: (_: any, args: any, context: Context) =>
    updateAddress(context, args),

  updateProfile: (_: any, { fields, customFields }: any, context: Context) =>
    updateProfile(context, fields, customFields),

  updateProfilePicture: (_: any, { file }: { file: any }, context: Context) =>
    updateProfilePicture(context, file),

  uploadProfilePicture: (_: any, { file }: { file: any }, context: Context) =>
    updateProfilePicture(context, file),

  subscribeNewsletter: async (
    _: any,
    { email, isNewsletterOptIn }: SubscribeNewsletterArgs,
    context: Context
  ) => {
    const profile = context.clients.profile
    const optIn =
      isNewsletterOptIn === undefined || isNewsletterOptIn === true
        ? TRUE
        : FALSE
    await profile.updatePersonalPreferences(
      { email, userId: '' },
      {
        isNewsletterOptIn: optIn,
      }
    )

    return true
  },
}

export const queries = {
  profile: (_: any, { customFields }: any, context: Context) =>
    getProfile(context, customFields),

  checkProfileAllowed: async (_: any, __: any, context: Context) => {
    const {
      clients: { catalog, session },
      vtex: { segment },
      cookies,
    } = context
    const salesChannel = segment ? segment.channel : null

    const { sessionData } = await session.getSession(
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
    const available = availableSalesChannels.find(sc => sc.Id == salesChannel)

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
