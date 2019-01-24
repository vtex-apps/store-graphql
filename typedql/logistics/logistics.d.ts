import { Float } from '../primitive'

export interface ShippingData {
  logisticsInfo?: LogisticsInfo[]
  messages?: MessageInfo[]
}

export interface MessageInfo {
  code?: string
  text?: string
  status?: string
  fields?: MessageFields
}

export interface MessageFields {
  itemIndex?: string
  ean?: string
  skuName?: string
}

export interface LogisticsInfo {
  itemIndex?: string
  slas?: ShippingSLA[]
}

export interface ShippingSLA {
  id?: string
  name?: string
  price?: Float
  shippingEstimate?: string
  shippingEstimateDate?: string
}

/**
 * @graphql input
 */
export interface ShippingItem {
  id?: string
  quantity?: string
  seller?: string
}
