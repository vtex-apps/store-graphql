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
  createAddress: (_, { fields }, context: Context) => createAddress(context, fields),

  deleteAddress: (_, { id }, context: Context) => deleteAddress(context, id),

  updateAddress: (_, args, context: Context) => updateAddress(context, args),

  updateProfile: (_, { fields, customFields }, context: Context) =>
    updateProfile(context, fields, customFields),

  updateProfilePicture: (_, { file }, context: Context) =>
    updateProfilePicture(context, file),

  uploadProfilePicture: (_, { file }, context: Context) =>
    updateProfilePicture(context, file),

  subscribeNewsletter: async (_, { email }, context: Context) => {
    const profile = context.dataSources.profile

    await profile.updatePersonalPreferences(email, {
      isNewsletterOptIn: 'True',
    })

    return true
  }
}

export const queries = {
  profile: (_, { customFields }, context) => getProfile(context, customFields),
}

export const fieldResolvers = fieldR
