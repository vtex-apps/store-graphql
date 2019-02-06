import { forLegacy, InstanceOptions, IOContext, IODataSource } from '@vtex/api'
import { prop } from 'ramda'

export class Segment extends IODataSource {
  protected httpClientFactory = forLegacy

  constructor(context: IOContext, options: InstanceOptions = {}) {
    super(context, options)
    this.service = `http://${context.account}.myvtex.com/api`
  }

  public getDefaultSalesChannel = () => {
    return this.http.get(`/segments`).then(prop('cultureInfo'))
  }

  public getCultureInfo = (segmentToken: string) => {
    return this.http.get(`/segments/${segmentToken}`).then(prop('cultureInfo'))
  }
}
