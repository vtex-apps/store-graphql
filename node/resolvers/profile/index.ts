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
  createAddress: (_, { fields }, context) => createAddress(context, fields),

  deleteAddress: (_, { id }, context) => deleteAddress(context, id),

  updateAddress: (_, args, context) => updateAddress(context, args),

  updateProfile: (_, { fields, customFields }, context) =>
    updateProfile(context, fields, customFields),

  updateProfilePicture: (_, { file }, context) =>
    updateProfilePicture(context, file),

  uploadProfilePicture: (_, { file }, context) =>
    updateProfilePicture(context, file),
}

export const queries = {
  profile: (_, { customFields }, context) => getProfile(context, customFields),
}

export const fieldResolvers = fieldR
