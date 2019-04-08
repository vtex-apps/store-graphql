import { RequestOptions } from 'apollo-datasource-rest'
import { forEachObjIndexed } from 'ramda'

import { RESTDataSource } from './RESTDataSource'

const DEFAULT_TIMEOUT_MS = 5 * 1000

export { SegmentData } from '@vtex/api'

export class SessionDataSource extends RESTDataSource {
  constructor() {
    super()
  }

  public updateSession = (key: string, value: any) =>
    this.post('/sessions', { public: { [key]: { value } } }, {metric: 'sessions-updateSession'})

  get baseURL() {
    const {
      vtex: { account },
    } = this.context
    return `http://${account}.vtexcommercestable.com.br/api`
  }

  protected willSendRequest(request: RequestOptions) {
    const {
      vtex: { authToken, segmentToken, sessionToken },
    } = this.context
    const sessionCookie = sessionToken

    if (!request.timeout) {
      request.timeout = DEFAULT_TIMEOUT_MS
    }

    forEachObjIndexed(
      (value: string, header) => request.headers.set(header, value),
      {
        ...(segmentToken && {
          Cookie: `vtex_segment=${segmentToken};vtex_session=${sessionCookie}`,
        }),
        'Content-Type': 'application/json',
        'Proxy-Authorization': authToken,
      }
    )
  }
}
