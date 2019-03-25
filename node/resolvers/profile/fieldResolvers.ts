import { prop } from 'ramda'

import { getAddresses, getPasswordLastUpdate, getPayments, pickCustomFieldsFromData } from './services'

export default {
  Address: {
    cacheId: prop('addressName'),
    id: prop('addressName'),
  },
  PaymentProfile: {
    cacheId: prop('id'),
  },
  Profile: {
    address: (_: any, __: any, context: any) => getAddresses(context),
    addresses: (_: any, __: any, context: any) => getAddresses(context),
    birthDate: (obj: any) => obj.birthDate ? new Date(obj.birthDate).toISOString() : obj.birthDate,
    cacheId: prop('email'),
    customFields: (obj: any) =>
      typeof obj.customFields === 'string'
        ? pickCustomFieldsFromData(obj.customFields, obj)
        : obj.customFields,
    passwordLastUpdate: (_, __, context) => getPasswordLastUpdate(context),
    payments: (_, __, context) => getPayments(context),
    profilePicture: (obj, _, context) =>
      obj.profilePicture &&
      `http://api.vtex.com/${context.vtex.account}/dataentities/CL/documents/${
      obj.id
      }/profilePicture/attachments/${obj.profilePicture}`,
  },
  ProfileCustomField: {
    cacheId: (root: any) => root.key,
  },
}
