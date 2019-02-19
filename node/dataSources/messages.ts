import { forWorkspace, InstanceOptions, IOContext, IODataSource } from '@vtex/api'
import {head} from 'ramda'

export class Messages extends IODataSource {
  protected httpClientFactory = forWorkspace
  protected service = 'messages.vtex'

  constructor(ctx?: IOContext, opts?: InstanceOptions) {
    super(ctx, opts)
  }

  public translate = async (from: string, to: string, content: string): Promise<string> => {
    if (from === to) {
      return content
    }
    try{
      return await this.http.get('/_v/translations', {
        params: {
          __p: process.env.VTEX_APP_ID,
          data: JSON.stringify([{from, content}]),
          to,
        },
        timeout: 3000,
      }).then(head)
    } catch(err) {
      return content
    }
  }
}

