import { Int, ID, Float } from '../primitive'
import { Address } from '../profile/profile'

export interface OrderForm {
  /* orderFormId is used as cacheId */
  cacheId?: ID
  orderFormId?: string
  value?: Float
  items?: OrderFormItem[]
  salesChannel?: string
  loggedIn?: boolean
  isCheckedIn?: boolean
  storeId?: string
  allowManualPrice?: boolean
  canEditData?: boolean
  userProfileId?: string
  userType?: string
  ignoreProfileData?: boolean
  totalizers?: Totalizer[]
  clientProfileData?: ClientProfile
  shippingData?: OrderFormShippingData
  storePreferencesData?: StorePreferencesData
}

export interface StorePreferencesData {
  countryCode?: string
  currencyCode?: string
  timeZone?: string
  currencyFormatInfo?: CurrencyFormatInfo
  currencySymbol?: string
}

export interface CurrencyFormatInfo {
  currencyDecimalDigits?: Int
  currencyDecimalSeparator?: string
  currencyGroupSeparator?: string
  startsWithCurrencySymbol?: boolean
}

export interface OrderFormItem {
  id?: ID
  name?: string
  detailUrl?: string
  imageUrl?: string
  skuName?: string
  quantity?: Float
  uniqueId?: string
  productId?: string
  refId?: string
  ean?: string
  priceValidUntil?: string
  price?: Float
  tax?: Int
  listPrice?: Float
  sellingPrice?: Float
  rewardValue?: Int
  isGift?: boolean
}

export interface Totalizer {
  id?: ID
  name?: string
  value?: Float
}

export interface ClientProfile {
  email?: string
  firstName?: string
  lastName?: string
  phone?: string
  isCorporate?: boolean
  corporateDocument?: string
  corporateName?: string
  corporatePhone?: string
  document?: string
  documentType?: string
  stateInscription?: string
  tradeName?: string
}

export interface OrderFormShippingData {
  address?: Address
  availableAddresses: Address[]
  selectedAddresses: Address[]
}

/**
 * @graphql input
 */
export interface OrderFormItemInput {
  id?: Int
  index?: Int
  quantity?: Int
  seller?: ID
}

/**
 * @graphql input
 */
export interface OrderFormAddressInput {
  addressType?: string
  postalCode?: string
  country?: string
  receiverName?: string
  city?: string
  state?: string
  street?: string
  number?: string
  complement?: string
  neighborhood?: string
  geoCoordinates?: Float[]
}

/**
 * @graphql input
 */
export interface OrderFormPaymentInput {
  paymentSystem?: Int
  referenceValue?: Float
  bin?: Int
  tokenId?: string
}

/**
 * @graphql input
 */
export interface OrderFormProfileInput {
  email?: string
  isCorporate?: boolean
  corporateDocument?: string
  corporateName?: string
  corporatePhone?: string
  document?: string
  documentType?: string
  firstName?: string
  lastName?: string
  phone?: string
  stateInscription?: string
  tradeName?: string
}

/**
 * @graphql input
 */
export interface OrderFormPaymentTokenInput {
  tokenId?: string
  cardNumber?: string
  bin?: string
  paymentSystem?: string
  paymentSystemName?: string
}

/**
 * @graphql input
 */
export interface OrderFormCheckinInput {
  isCheckedIn?: boolean
  pickupPointId?: string
}
