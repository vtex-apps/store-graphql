import { RequestOptions, RESTDataSource } from 'apollo-datasource-rest'

export class ProfileSystemDataSource extends RESTDataSource<ServiceContext> {
  constructor() {
    super()
  }

  public payments = async (id: string) => this.get(
    `/pvt/profiles/${id}/vcs-checkout`
  )

  get baseURL() {
    const {vtex: {account}} = this.context
    return `http://${account}.vtexcommercestable.com.br/api/profile-system`
  }

  protected willSendRequest (request: RequestOptions) {
    const {vtex: {authToken}} = this.context
    request.headers.set('Authorization', authToken)
    request.headers.set('Content-Type', 'application/json')
    request.headers.set('Accept', 'application/json')
  }
}
