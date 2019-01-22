import { prop } from 'ramda'

import { getPayments, getAddresses, pickCustomFieldsFromData } from './services'

export default {
  Profile: {
    cacheId: prop('email'),
    profilePicture: (obj, args, context) =>  obj.profilePicture && obj.id
       && `//api.vtex.com/${context.vtex.account}/dataentities/CL/documents/${obj.id}/profilePicture/attachments/${obj.profilePicture}`,
    payments: (obj, args, context) => obj.id && getPayments(context, obj.id),
    address: (obj, args, context) => obj.id && getAddresses(context, obj.id),
    customFields: (obj) =>  { 
      if (typeof obj.customFields === 'string')
        return pickCustomFieldsFromData(obj.customFields, obj)
        
      return obj.customFields
    }
  },
  ProfileCustomField: {
    cacheId: (root) => root.key
  },
  Address: {
    cacheId: prop('id')
  },
  PaymentProfile: {
    cacheId: prop('id')
  }
}