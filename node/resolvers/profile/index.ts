import fieldR from './fieldResolvers'
import {
  createAddress,
  deleteAddress,
  getProfile,
  updateAddress,
  updateProfile,
  updateProfilePicture,
} from './services'

interface SubscribeNewsletterArgs {
  email: string
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

  subscribeNewsletter: async (_: any, { email }: SubscribeNewsletterArgs, context: Context) => {
    const profile = context.clients.profile
    await profile.updatePersonalPreferences({ email, userId: '' }, {
      isNewsletterOptIn: 'True',
    })

    return true
  },
}

export const queries = {
  profile: (_: any, { customFields }: any, context: Context) =>
    getProfile(context, customFields),
}

export const fieldResolvers = fieldR
