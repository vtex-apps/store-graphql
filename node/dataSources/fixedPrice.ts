import { Request, RequestOptions, Response, RESTDataSource } from 'apollo-datasource-rest'
import { forEachObjIndexed } from 'ramda'


const SetCookieWhitelist = [
    'fixedprice.vtex.com',
    '.ASPXAUTH',
]

const isWhitelistedSetCookie = (cookie: string) => {
    const [key] = cookie.split('=')
    return SetCookieWhitelist.includes(key)
}
  

export class FixedPriceDataSource extends RESTDataSource<ServiceContext> {
    constructor() {
      super()
    }

    public fixedPrices = (itemId: string) =>{
        // console.log('------fixed price')
        // console.log(itemId);
        return this.get(`/${itemId}`);
    } 

    get baseURL() {
        const {vtex: {account, workspace, region}} = this.context
        return `https://api.vtex.com/${account}/pricing/prices`;
    }
    
    // protected async didReceiveResponse (response: Response, request: Request) {
    //     const result = await super.didReceiveResponse(response, request)
    
    //     const rawHeaders = (response.headers as any).raw() as Record<string, any>
    //     const responseSetCookies: string[] = rawHeaders ? rawHeaders['set-cookie'] : []
    //     const forwardedSetCookies = responseSetCookies.filter(isWhitelistedSetCookie)
    //     if (forwardedSetCookies.length > 0) {
    //       this.context.set('set-cookie', forwardedSetCookies)
    //     }
    
    //     return result
    // }
    
    protected willSendRequest (request: RequestOptions) {
        const {vtex: {authToken, production}, cookies} = this.context
        const segment = cookies.get('vtex_segment')
        const [appMajorNumber] = process.env.VTEX_APP_VERSION.split('.')
        const appMajor = `${appMajorNumber}.x`
    
        forEachObjIndexed(
          (value: string, param: string) => request.params.set(param, value),
          {
            '__v': appMajor,
            'production': production ? 'true' : 'false',
            ...segment && {'vtex_segment': segment},
          }
        )
    
        forEachObjIndexed(
          (value: string, header) => request.headers.set(header, value),
          {
            'Accept-Encoding': 'gzip',
            Authorization: authToken,
            ...segment && {Cookie: `vtex_segment=${segment}`},
          }
        )
    }
}