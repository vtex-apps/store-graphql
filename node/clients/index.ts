import { IOClients } from '@vtex/api'

import { CallCenterOperator } from './callCenterOperator'
import { Catalog } from './catalog'
import { Checkout } from './checkout'
import { Identity } from './identity'
import { LogisticsClient } from './logistics'
import { MasterData } from './masterdata'
import { OMS } from './oms'
import { Portal } from './portal'
import { ProfileClient } from './profile'

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

  public get portal() {
    return this.getOrSet('portal', Portal)
  }

  public get logistics() {
    return this.getOrSet('logistics', LogisticsClient)
  }

  public get identity() {
    return this.getOrSet('identity', Identity)
  }
}
