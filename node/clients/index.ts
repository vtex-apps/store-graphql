import { IOClients } from '@vtex/api'

import { MasterData } from './masterdata'

export class Clients extends IOClients {
  get masterdata() {
    return this.getOrSet('masterdata', MasterData)
  }
}
