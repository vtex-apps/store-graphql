import { IOClients } from '@vtex/api'

import { Checkout } from './checkout'
import { MasterData } from './masterdata'

export class Clients extends IOClients {
  public get masterdata() {
    return this.getOrSet('masterdata', MasterData)
  }
  public get checkout() {
    return this.getOrSet('checkout', Checkout)
  }
}
