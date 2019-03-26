import { HttpClient, HttpClientFactory, IODataSource } from '@vtex/api'

const forProfile: HttpClientFactory = ({context, options}) => context &&
  HttpClient.forExternal(`http://${context.account}.vtexcommercestable.com.br/api/profile-system/pvt/profiles`, context, {...options, headers: {
    'Proxy-Authorization': context.authToken,
    'VtexIdClientAutCookie': context.authToken,
    'X-Vtex-Proxy-To': `http://${context.account}.vtexcommercestable.com.br`,
  }, metrics})

export class PaymentsDataSource extends IODataSource {
  protected httpClientFactory = forProfile

  public getUserPayments = (userId: string) => this.http.get(`/${userId}/vcs-checkout`, {
    metric: 'payments-get',
  })
}
