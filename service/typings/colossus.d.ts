declare module 'colossus' {
  import {Context as KoaContext} from 'koa'

  export type ColossusContext = KoaContext & {
    vtex: {
      account: string
      workspace: string
      authToken: string
      params: {
        [param: string]: string
      }
      region: string
      route: string
    }
  }

  type EndpointHandler = (ctx: ColossusContext) => void
}
