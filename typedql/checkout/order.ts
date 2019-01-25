import { Float, Int } from '../primitive'
import { StorePreferencesData } from './orderForm'
import { LogisticsInfo } from '../logistics/logistics'

export interface Order {
  allowCancellation?: boolean
  orderId?: string
  orderGroup?: string
  state?: string
  value?: Float
  salesChannel?: string
  creationDate?: string
  lastChange?: string
  timeZoneCreationDate?: string
  timeZoneLastChange?: string
  isCompleted?: boolean
  items?: OrderItem[]
  sellers?: OrderItemSeller[]
  totals?: OrderItemTotal[]
  paymentData?: OrderItemPaymentData
  shippingData?: OrderItemShippingData
  storePreferencesData?: StorePreferencesData
}

export interface OrderItem {
  uniqueId?: string
  id?: string
  productId?: string
  refId?: string
  name?: string
  skuName?: string
  tax?: Float
  price?: Float
  listPrice?: Float
  sellingPrice?: Float
  rewardValue?: Float
  additionalInfo?: OrderItemAdditionalInfo
  preSaleDate?: string
  handling?: boolean
  isGift?: boolean
  quantity?: Int
  seller?: string
  imageUrl?: string
  detailUrl?: string
  availability?: string
  measurementUnit?: string
  unitMultiplier?: Int
}

export interface OrderItemAdditionalInfo {
  brandName?: string
  brandId?: string
}

export interface OrderItemSeller {
  id?: string
  name?: string
  logo?: string
}

export interface OrderItemTotal {
  id?: string
  name?: string
  value?: Float
}

export interface OrderItemPaymentData {
  payments?: OrderItemPayment[]
}

export interface OrderItemPayment {
  paymentSystemName?: string
  value?: Float
  installments?: Int
  connectorResponses?: OrderItemPaymentConnectorResponse
  lastDigits?: string
  group?: string
}

export interface OrderItemPaymentConnectorResponse {
  tid?: string
  returnCode?: string
  message?: string
}

export interface OrderItemShippingData {
  logisticsInfo?: LogisticsInfo[]
  address?: OrderItemShippingDataAddress
}

export interface OrderItemShippingDataAddress {
  receiverName?: string
  postalCode?: string
  city?: string
  state?: string
  country?: string
  street?: string
  number?: string
  neighborhood?: string
  complement?: string
  reference?: string
}

