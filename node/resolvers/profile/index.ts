import { getProfile, updateProfile, createAddress, updateAddress, deleteAddress, updateProfilePicture } from './services'
import fieldR from './fieldResolvers'

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

  updateProfile: (_, { fields }, context) => updateProfile(context,fields),

  updateProfilePicture: (_, args, context) => updateProfilePicture(context, args, true),

  uploadProfilePicture: (_, args, context) => updateProfilePicture(context, args, false)
}

export const queries = {
  profile: (_, args, context) => getProfile(context, args),
}

export const fieldResolvers = fieldR