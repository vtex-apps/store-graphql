import { prop } from 'ramda'

import { getPayments, pickCustomFieldsFromData } from './profileResolver'

export default {
  Profile: {
    cacheId: prop('email'),
    profilePicture: (obj, args, context, info) =>  obj.profilePicture && obj.id
       && `//api.vtex.com/${context.vtex.account}/dataentities/CL/documents/${obj.id}/profilePicture/attachments/${obj.profilePicture}`,
    payments: (obj, args, context, info) => obj.userId && getPayments(context.vtex, obj.userId, obj.address),
    customFields: (obj) =>  { 
      if(typeof obj.customFields === 'string')
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