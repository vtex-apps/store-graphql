import { ServiceContext } from '@vtex/api'

import { dataSources } from './dataSources'
import { CatalogDataSource } from './dataSources/catalog'
import { CheckoutDataSource } from './dataSources/checkout'
import { DocumentDataSource } from './dataSources/document'
import { PortalDataSource } from './dataSources/portal'
import { SessionDataSource } from './dataSources/session'
import { ProfileDataSource } from './dataSources/profile'
import { PaymentsDataSource } from './dataSources/payments'


declare global {
  interface Context extends ServiceContext {
    dataSources: StoreGraphQLDataSources
    originalPath: string
    cookie: string
    currentProfile: CurrentProfile
  }

  interface StoreGraphQLDataSources {
    catalog: CatalogDataSource
    checkout: CheckoutDataSource
    document: DocumentDataSource
    portal: PortalDataSource
    session: SessionDataSource
    profile: ProfileDataSource
    payments: PaymentsDataSource
  }

  interface OrderFormItem {
    id: string
    name: string
    detailUrl: string
    imageUrl: string
    skuName: string
    quantity: number
    uniqueId: string
    productId: string
    refId: string
    ean: string
    priceValidUntil: string
    price: number
    tax: number
    listPrice: number
    sellingPrice: number
    rewardValue: number
    isGift: boolean
  }

  interface UserAddress {
    id: string
  }

  interface CurrentProfile {
    email: string
    userId: string
  }
}

export {}
