import { IOClients } from '@vtex/api'

import { CallCenterOperator } from './callCenterOperator'
import { Catalog } from './catalog'
import { Checkout } from './checkout'
import { MasterData } from './masterdata'
import { ProfileClient } from './profile'
import { OMS } from './oms'

export class Clients extends IOClients {
  public get masterdata() {
    return this.getOrSet('masterdata', MasterData)
  }

  public get checkout() {
    return this.getOrSet('checkout', Checkout)
  }

  public get callCenterOperator() {
    return this.getOrSet('callCenterOperator', CallCenterOperator)
  }

  public get catalog() {
    return this.getOrSet('catalog', Catalog)
  }

  public get profile() {
    return this.getOrSet('profile', ProfileClient)
  }
  
  public get oms() {
    return this.getOrSet('oms', OMS)
  }
}
