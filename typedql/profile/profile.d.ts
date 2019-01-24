import { ID, Float } from '../primitive'
import { PaymentProfile } from '../payment/payment'

export interface Profile {
  /* email is used as cacheId */
  cacheId?: ID
  /* profile ID */
  id?: ID
  /* User's first name */
  firstName?: string
  /* User's last name */
  lastName?: string
  /* User's profile picture (only fetched if saved as 'profilePicture') */
  profilePicture?: string
  /* User's email */
  email?: string
  /* Document identification. E.g. CPF, SSN, Driver License */
  document?: string
  /* User's phone number */
  phone?: string
  /* User's ID */
  userId?: string
  /* User's birth date */
  birthDate?: string
  /* User's gender (plain unvalidated string) */
  gender?: string
  /* User' personal phone */
  homePhone?: string
  /* User's business phone */
  businessPhone?: string
  /* Collection of user's address */
  address?: Address[]
  /* Whether the user is a corporation or not */
  isCorporate?: boolean
  /* User's company trade name */
  tradeName?: string
  /* User's company corporate name */
  corporateName?: string
  /* User's company corporate document (e.g. CNPJ) */
  corporateDocument?: string
  /* User's company state registration */
  stateRegistration?: string
  /* Collection of user's payment data */
  payments?: PaymentProfile[]
  /* Other fields to query */
  customFields?: ProfileCustomField[]
}

/* Custom fields to add to query */
export interface ProfileCustomField {
  /* Id used for caching */
  cacheId?: ID
  /* Name of the custom field */
  key?: string
  /* Value of the custom field */
  value?: string
}
/* Profile information that is receive in session */
export interface SessionProfile {
  /* profile ID */
  id?: ID
  /* User first name */
  firstName?: string
  /* User last name */
  lastName?: string
  /* User email */
  email?: string
  /* Document identification. E.g. CPF, SSN, Driver License */
  document?: string
  /* User phone number */
  phone?: string
}

export interface Address {
  id?: string
  userId?: string
  receiverName?: string
  complement?: string
  neighborhood?: string
  country?: string
  state?: string
  number?: string
  street?: string
  geoCoordinates?: Float[]
  postalCode?: string
  city?: string
  reference?: string
  addressName?: string
  addressType?: string
}

/**
 * @graphql input
 */
export interface ProfileCustomFieldInput {
  key?: string
  value?: string
}

/**
 * @graphql input
 */
export interface ProfileInput {
  /* User's email */
  email: string
  /* User's first name */
  firstName?: string
  /* User's last name */
  lastName?: string
  /* Document identification. E.g. CPF, SSN, Driver License */
  document?: string
  /* User's phone number */
  phone?: string
  /* User's birth date */
  birthDate?: string
  /* User's gender (plain unvalidated string) */
  gender?: string
  /* User' personal phone */
  homePhone?: string
  /* User's business phone */
  businessPhone?: string
  /* User's company trade name */
  tradeName?: string
  /* User's company corporate name */
  corporateName?: string
  /* User's company corporate document (e.g. CNPJ) */
  corporateDocument?: string
  /* User's company state registration */
  stateRegistration?: string
  /* Whether the user is a corporation or not */
  isCorporate?: boolean
}

/**
 * @graphql input
 */
export interface AddressInput {
  receiverName?: string
  complement?: string
  neighborhood?: string
  country?: string
  state?: string
  number?: string
  street?: string
  geoCoordinates?: Float[]
  postalCode?: string
  city?: string
  reference?: string
  addressName?: string
  addressType?: string
}
