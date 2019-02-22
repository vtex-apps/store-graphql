import { HttpClient, HttpClientFactory, IOContext, IODataSource } from '@vtex/api'

const withHeadersFromContext = ({account, authToken}: IOContext) => ({
  'Proxy-Authorization': authToken,
  'VtexIdClientAutCookie': authToken,
  'X-Vtex-Proxy-To': `http://${account}.vtexcommercestable.com.br`,
})

const forLegacy: HttpClientFactory = ({options, context}) => {
  const {account = ''} = context || {}
  const baseURL = `http://${account}.vtexcommercestable.com.br/api/profile-system/pvt/profiles`
  return HttpClient.forLegacy(baseURL, options || {} as any)
}

export class PaymentsDataSource extends IODataSource {
  protected httpClientFactory = forLegacy

  public getUserPayments = (userId: string) => this.http.get(`/${userId}/vcs-checkout`, {
    headers: withHeadersFromContext(this.context)
  })
}
