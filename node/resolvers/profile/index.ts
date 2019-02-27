import fieldR from './fieldResolvers'
import { createAddress, deleteAddress, getProfile, updateAddress, updateProfile, updateProfilePicture } from './services'

export const mutations = {
  createAddress: async (_, args, context) => {
    await createAddress(context, args)

    return getProfile(context, args)
  },

  deleteAddress: async (_, args, context) => {
    await deleteAddress(args, args.id)

    return getProfile(context, args)
  },

  updateAddress: (_, args, context) => updateAddress(context, args),

  updateProfile: (_, { fields, customFields }, context) => updateProfile(context, fields, customFields),

  updateProfilePicture: (_, { file }, context) => updateProfilePicture(context, file),

  uploadProfilePicture: (_, { file }, context) => updateProfilePicture(context, file)
}

export const queries = {
  profile: (_, { customFields }, context) => getProfile(context, customFields),
}

export const fieldResolvers = fieldR
