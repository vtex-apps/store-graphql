declare module 'graphql' {
import {ColossusContext} from 'colossus'

  interface GraphqlResponse {
    cookie?: any,
    data: any,
  }

  interface GraphqlRequestBody {
    cookie: any,
    data: any,
    root: any,
    fields: any,
  }

  type GraphqlResolver = (body: GraphqlRequestBody, ioContext: ColossusContext['vtex']) => Promise<GraphqlResponse>
}
