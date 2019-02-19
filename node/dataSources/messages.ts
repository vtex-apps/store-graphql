import { RequestOptions, RESTDataSource } from 'apollo-datasource-rest'
import {head} from 'ramda'

export class Messages extends RESTDataSource<Context>{
  constructor() {
    super()
  }

  public translate = async (from: string, to: string, content: string): Promise<string> =>  await this.get('/_v/translations', {data: JSON.stringify([{from, content}]), to}).then(head)

  get baseURL() {
    const {vtex: {region, account, workspace}} = this.context
    return `http://messages.vtex.${region}.vtex.io/${account}/${workspace}`
  }

  protected willSendRequest = (request: RequestOptions) => {
    const {vtex: {authToken}} = this.context
    request.headers.set('Authorization', authToken)
    request.params.append('__p', process.env.VTEX_APP_ID)
  }
}
