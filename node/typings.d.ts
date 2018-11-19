import { IOContext as ioContext } from '@vtex/api'
import { Context as KoaContext } from 'koa'

import { dataSources } from './dataSources'
import { CatalogDataSource } from './dataSources/catalog'
import { CheckoutDataSource } from './dataSources/checkout'
import { DocumentDataSource } from './dataSources/document'
import { PortalDataSource } from './dataSources/portal'
import { SessionDataSource } from './dataSources/session'

declare global {
  interface IOContext extends ioContext {
    params: {
      [param: string]: string
    }
    route: {
      id: string
      declarer: string
      params: {
        [param: string]: string
      }
    },
  }

  interface ServiceContext extends KoaContext {
    vtex: IOContext
    dataSources: StoreGraphQLDataSources
    originalPath: string
  }

  interface StoreGraphQLDataSources {
    catalog: CatalogDataSource
    checkout: CheckoutDataSource
    document: DocumentDataSource
    portal: PortalDataSource
    session: SessionDataSource
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
}

export {}
