import { prop } from 'ramda'

import {
  getAddresses,
  getPasswordLastUpdate,
  getPayments,
  pickCustomFieldsFromData,
} from './services'

export default {
  Address: {
    cacheId: prop('addressName'),
    id: prop('addressName'),
    geoCoordinates: ({ geoCoordinate, geoCoordinates }: any) =>
      geoCoordinate || geoCoordinates,
  },
  PaymentProfile: {
    cacheId: prop('id'),
  },
  Profile: {
    address: (obj: any, __: any, context: any) => getAddresses(context, obj),
    addresses: (obj: any, __: any, context: any) => getAddresses(context, obj),
    birthDate: (obj: any) =>
      obj.birthDate ? new Date(obj.birthDate).toISOString() : obj.birthDate,
    cacheId: prop('email'),
    customFields: (obj: any) =>
      typeof obj.customFields === 'string'
        ? pickCustomFieldsFromData(obj.customFields, obj)
        : obj.customFields,
    passwordLastUpdate: (_: any, __: any, context: any) =>
      getPasswordLastUpdate(context),
    payments: (_: any, __: any, context: any) => getPayments(context),
    profilePicture: (obj: any, _: any, context: any) =>
      obj.profilePicture &&
      `https://${context.vtex.account}.vteximg.com.br/assets/vtex.store-graphql/image/${obj.profilePicture}`,
    // the next transformations are necessary since the profile system and
    // this profile graphql query (the same applies to mutations) were built upon different contracts.
    corporateDocument: (obj: any, _: any, __: any) => obj.businessDocument,
    isCorporate: (obj: any, _: any, __: any) => obj.isPJ === 'True',
    tradeName: (obj: any, _: any, __: any) => obj.fancyName,
    pii: (obj: any, _: any, __: any) => obj.pii,
  },
  ProfileCustomField: {
    cacheId: (root: any) => root.key,
  },
}
