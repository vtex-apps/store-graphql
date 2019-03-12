import { prop } from 'ramda'

import { getAddresses, getPayments, pickCustomFieldsFromData } from './services'

export default {
  Address: {
    cacheId: prop('addressName'),
    id: prop('addressName'),
  },
  PaymentProfile: {
    cacheId: prop('id'),
  },
  Profile: {
    address: (_, __, context) => getAddresses(context),
    addresses: (_, __, context) => getAddresses(context),
    cacheId: prop('email'),
    customFields: obj =>
      typeof obj.customFields === 'string'
        ? pickCustomFieldsFromData(obj.customFields, obj)
        : obj.customFields,
    payments: (_, __, context) => getPayments(context),
    profilePicture: (obj, _, context) =>
      obj.profilePicture &&
      `http://api.vtex.com/${context.vtex.account}/dataentities/CL/documents/${
      obj.id
      }/profilePicture/attachments/${obj.profilePicture}`,
  },
  ProfileCustomField: {
    cacheId: root => root.key,
  },
}
