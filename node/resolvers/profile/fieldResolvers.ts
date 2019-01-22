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
    address: (obj, args, context) => obj.id && getAddresses(context, obj.id),
    cacheId: prop('email'),
    customFields: (obj) =>  { 
      if (typeof obj.customFields === 'string') { 
        return pickCustomFieldsFromData(obj.customFields, obj)
      }
        
      return obj.customFields
    },
    payments: (obj, args, context) => obj.id && getPayments(context, obj.id),
    profilePicture: (obj, args, context) => obj.profilePicture && obj.id
       && `//api.vtex.com/${context.vtex.account}/dataentities/CL/documents/${obj.id}/profilePicture/attachments/${obj.profilePicture}`
  },
  ProfileCustomField: {
    cacheId: (root) => root.key
  }
}