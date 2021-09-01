import { IOClients } from '@vtex/api'

import { CallCenterOperator } from './callCenterOperator'
import { Catalog } from './catalog'
import { Checkout, CheckoutNoCookies } from './checkout'
import { MasterData } from './masterdata'
import { ProfileClient } from './profile'
import { OMS } from './oms'
import { Portal } from './portal'
import { LogisticsClient } from './logistics'
import { Session } from './session'
import { Rewriter } from './rewriter'

export class Clients extends IOClients {
  public get masterdata() {
    return this.getOrSet('masterdata', MasterData)
  }

  public get checkout() {
    return this.getOrSet('checkout', Checkout)
  }

  public get checkoutNoCookies() {
    return this.getOrSet('checkoutNoCookies', CheckoutNoCookies)
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

  public get customSession() {
    return this.getOrSet('customSession', Session)
  }

  public get rewriter() {
    return this.getOrSet('rewriter', Rewriter)
  }
}
