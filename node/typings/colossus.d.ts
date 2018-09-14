declare module 'colossus' {
  import { Context as KoaContext } from 'koa'

  export interface IOContext {
    account: string
    workspace: string
    authToken: string
    params: {
      [param: string]: string
    }
    region: string
    route: string
  }

  export interface ColossusContext<T = {}> extends KoaContext {
    vtex: IOContext
    dataSources: T
  }
}
