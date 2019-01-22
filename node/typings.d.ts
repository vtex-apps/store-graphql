import { ServiceContext } from '@vtex/api'

import { dataSources } from './dataSources'
import { CatalogDataSource } from './dataSources/catalog'
import { CheckoutDataSource } from './dataSources/checkout'
import { DocumentDataSource } from './dataSources/document'
import { IdentityDataSource } from './dataSources/identity'
import { LicenseManagerDataSource } from './dataSources/licenseManager'
import { PaymentsDataSource } from './dataSources/payments'
import { PortalDataSource } from './dataSources/portal'
import { ProfileDataSource } from './dataSources/profile'
import { SessionDataSource } from './dataSources/session'
import { CallcenterOperatorDataSource } from './dataSources/callcenterOperator'

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
    identity: IdentityDataSource
    licenseManager: LicenseManagerDataSource
    payments: PaymentsDataSource
    portal: PortalDataSource
    profile: ProfileDataSource
    session: SessionDataSource
    callcenterOperator: CallcenterOperatorDataSource
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
    addressName: string
  }

  interface UserProfile {
    id: string
  }

  interface CurrentProfile {
    email: string
    userId: string
  }
}

export {}
