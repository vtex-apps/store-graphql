import { IOClients } from '@vtex/api'

import { CallCenterOperator } from './callCenterOperator'
import { Catalog } from './catalog'
import { Checkout } from './checkout'
import { PvtCheckout } from './PvtCheckout'
import { MasterData } from './masterdata'
import { ProfileClient } from './profile'
import { ProfileClientV1 } from './profile/profileV1'
import { ProfileClientV2 } from './profile/profileV2'
import { LicenseManagerExtendedClient } from './licenseManagerExtended'
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

  public get pvtCheckout() {
    return this.getOrSet('pvtCheckout', PvtCheckout)
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

  public get profileV1() {
    return this.getOrSet('profileV1', ProfileClientV1)
  }

  public get profileV2() {
    return this.getOrSet('profileV2', ProfileClientV2)
  }

  public get licenseManagerExtended() {
    return this.getOrSet('licenseManagerExtended', LicenseManagerExtendedClient)
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
