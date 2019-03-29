import fieldR from './fieldResolvers'
import {
  createAddress,
  deleteAddress,
  getProfile,
  updateAddress,
  updateProfile,
  updateProfilePicture,
} from './services'

export const mutations = {
  createAddress: (_: any, { fields }: any, context: Context) => createAddress(context, fields),

  deleteAddress: (_: any, { id }: any, context: Context) => deleteAddress(context, id),

  updateAddress: (_: any, args: any, context: Context) => updateAddress(context, args),

  updateProfile: (_: any, { fields, customFields }: any, context: Context) =>
    updateProfile(context, fields, customFields),

  updateProfilePicture: (_: any, { file }: any, context: Context) =>
    updateProfilePicture(context, file),

  uploadProfilePicture: (_: any, { file }: any, context: Context) =>
    updateProfilePicture(context, file),

  subscribeNewsletter: async (_: any, { email }: any, context: Context) => {
    const profile = context.dataSources.profile

    await profile.updatePersonalPreferences(email, {
      isNewsletterOptIn: 'True',
    })

    return true
  }
}

export const queries = {
  profile: (_: any, { customFields }: any, context: any) => getProfile(context, customFields),
}

export const fieldResolvers = fieldR
