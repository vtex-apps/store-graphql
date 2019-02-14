import { prop } from 'ramda'

import { getAddresses, getPayments, pickCustomFieldsFromData } from './services'

export default {
  Address: {
    cacheId: prop('id')
  },
  PaymentProfile: {
    cacheId: prop('id')
  },
  Profile: {
    address: (obj, _, context) => getAddresses(context, obj.id),
    cacheId: prop('email'),
    customFields: (obj) => typeof obj.customFields === 'string' ? pickCustomFieldsFromData(obj.customFields, obj) : obj.customFields,
    payments: (obj, _, context) => getPayments(context, obj.id),
    profilePicture: (obj, _, context) => obj.profilePicture
      && `//api.vtex.com/${context.vtex.account}/dataentities/CL/documents/${obj.id}/profilePicture/attachments/${obj.profilePicture}`
  },
  ProfileCustomField: {
    cacheId: (root) => root.key
  }
}
