import { IOContext, ServiceContext } from '@vtex/api'
import { DataSource } from 'apollo-datasource'

import { dataSources } from './dataSources'
import { CallcenterOperatorDataSource } from './dataSources/callcenterOperator'
import { CatalogDataSource } from './dataSources/catalog'
import { CheckoutDataSource } from './dataSources/checkout'
import { DocumentDataSource } from './dataSources/document'
import { IdentityDataSource } from './dataSources/identity'
import { LicenseManagerDataSource } from './dataSources/licenseManager'
import { LogisticsDataSource } from './dataSources/logistics'
import { OMSDataSource } from './dataSources/oms'
import { PaymentsDataSource } from './dataSources/payments'
import { PortalDataSource } from './dataSources/portal'
import { ProfileDataSource } from './dataSources/profile'
import { SessionDataSource } from './dataSources/session'

declare global {
  interface Context extends ServiceContext {
    dataSources: StoreGraphQLDataSources
    originalPath: string
    cookie: string
    vtex: CustomIOContext
  }

  interface CustomIOContext extends IOContext {
    currentProfile: CurrentProfile
  }

  interface StoreGraphQLDataSources extends Record<string, DataSource> {
    catalog: CatalogDataSource
    checkout: CheckoutDataSource
    document: DocumentDataSource
    identity: IdentityDataSource
    licenseManager: LicenseManagerDataSource
    logistics: LogisticsDataSource
    payments: PaymentsDataSource
    portal: PortalDataSource
    profile: ProfileDataSource
    session: SessionDataSource
    callcenterOperator: CallcenterOperatorDataSource
    oms: OMSDataSource
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
    parentItemIndex: number
    parentAssemblyBinding: string
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

  interface Item {
    thumb: string
    name: string
    href: string
    criteria: string
    slug: string
  }
}

export {}
