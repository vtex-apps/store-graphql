import { IOClients, RecorderState, ServiceContext } from '@vtex/api'
import { GraphQLSchema } from 'graphql'

declare global {
  interface Query {
    operationName: string
    variables: Record<string, any> | string
    query: string
  }

  interface State extends RecorderState {
    query: Query
    schema: GraphQLSchema
  }

  type Context = ServiceContext<IOClients, State>
}
