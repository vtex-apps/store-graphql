import { Functions } from '@gocommerce/utils'
import { RequestOptions } from 'apollo-datasource-rest'
import http from 'axios'
import { forEachObjIndexed } from 'ramda'

import { withAuthToken } from '../resolvers/headers'
import { RESTDataSource } from './RESTDataSource'
import { SegmentData } from './session'

const DEFAULT_TIMEOUT_MS = 8 * 1000

// 0 - 1 number with catalog proxy weight. A higher value means
// more queries will be routed to catalog proxy
const CATALOG_PROXY_AB_TEST_WEIGHT = 0.5

interface ProductsArgs {
  query: string
  category: string
  specificationFilters: string[]
  priceRange: string
  collection: string
  salesChannel: string
  orderBy: string
  from: number
  to: number
  map: string
}

/** Catalog API
 * Docs: https://documenter.getpostman.com/view/845/catalogsystem-102/Hs44
 */
export class CatalogDataSource extends RESTDataSource {
  private mode: 'proxy' | 'direct'
  private backend: 'vtex' | 'gocommerce'

  constructor() {
    super()

    this.mode = Math.random() < CATALOG_PROXY_AB_TEST_WEIGHT
      ? 'proxy'
      : 'direct'

    this.backend = 'vtex'
  }

  public product = (slug: string) => this.get(
    `/pub/products/search/${slug && slug.toLowerCase()}/p`,
    undefined,
    {metric: `catalog-product-${this.mode}`}
  )

  public productByEan = (id: string) => this.get(
    `/pub/products/search?fq=alternateIds_Ean=${id}`,
    undefined,
    {metric: `catalog-productByEan-${this.mode}`}
  )

  public productById = (id: string) => this.get(
    `/pub/products/search?fq=productId:${id}`,
    undefined,
    {metric: `catalog-productById-${this.mode}`}
  )

  public productByReference = (id: string) => this.get(
    `/pub/products/search?fq=alternateIds_RefId=${id}`,
    undefined,
    {metric: `catalog-productByReference-${this.mode}`}
  )

  public productBySku = (skuIds: string[]) => this.get(
    `/pub/products/search?${skuIds.map(skuId => `fq=skuId:${skuId}`).join('&')}`,
    undefined,
    {metric: `catalog-productBySku-${this.mode}`}
  )

  public products = (args: ProductsArgs) => this.get(
    this.productSearchUrl(args),
    undefined,
    {metric: `catalog-products-${this.mode}`}
  )

  public productsQuantity = async (args: ProductsArgs) => {
    const { vtex: ioContext, vtex: {account} } = this.context

    const headers = this.mode === 'direct'
      ? {'X-Vtex-Use-Https': 'true'}
      : {}

    const params = this.mode === 'direct' && this.backend !== 'gocommerce'
      ? {an: account}
      : {}

    const { headers: { resources } } = await http.request(
      {
        headers: withAuthToken(headers)(ioContext),
        method: this.backend === 'gocommerce' ? 'GET' : 'HEAD',
        params,
        url: `${this.baseURL}${this.productSearchUrl(args)}`,
      }
    )

    const quantity = resources.split('/')[1]

    return parseInt(quantity, 10)
  }

  public brands = () => this.get(
    `/pub/brand/list`,
    undefined,
    {metric: `catalog-brands-${this.mode}`}
  )

  public categories = (treeLevel: string) => this.get(
    `/pub/category/tree/${treeLevel}/`,
    undefined,
    {metric: `catalog-categories-${this.mode}`}
  )

  public facets = (facets: string = '') => {
    const [path, options] = decodeURI(facets).split('?')
    return this.get(
      `/pub/facets/search/${encodeURI(`${path.trim()}${options ? '?' + options : ''}`)}`,
      undefined,
      {metric: `catalog-${this.mode}`}
    )
  }

  public category = (id: string) => this.get(
    `/pub/category/${id}`,
    undefined,
    {metric: `catalog-category-${this.mode}`}
  )

  public crossSelling = (id: string, type: string) => this.get(
    `/pub/products/crossselling/${type}/${id}`,
    undefined,
    {metric: `catalog-crossSelling-${this.mode}`}
  )

  get baseURL() {
    const {vtex: {account, workspace, region}} = this.context
    this.backend = Functions.isGoCommerceAcc(this.context) ? 'gocommerce' : 'vtex'
    const directUrl = this.backend === 'gocommerce'
      ? `http://api.gocommerce.com/${account}/search`
      : `http://portal.vtexcommercestable.com.br/api/catalog_system`
    return this.mode === 'direct'
      ? directUrl
      : `http://store-graphql.vtex.${region}.vtex.io/${account}/${workspace}/proxy/catalog`
  }

  protected willSendRequest (request: RequestOptions) {
    const {vtex: {authToken, production, account}, cookies} = this.context
    const segmentData: SegmentData | null = (this.context.vtex as any).segment
    const { channel: salesChannel = '' } = segmentData || {}
    const segment = cookies.get('vtex_segment')
    const [appMajorNumber] = process.env.VTEX_APP_VERSION!.split('.')
    const appMajor = `${appMajorNumber}.x`

    if (!request.timeout) {
      request.timeout = DEFAULT_TIMEOUT_MS
    }

    const params = this.mode === 'proxy'
      ? {
        '__v': appMajor,
        'production': production ? 'true' : 'false',
        ...segment && {'vtex_segment': segment},
        ...!!salesChannel && {sc: salesChannel}
      } : {
        an: account,
        ...!!salesChannel && {sc: salesChannel}
      }

    forEachObjIndexed((value: string, param: string) => request.params.set(param, value), params)

    const headers = this.mode === 'proxy'
      ? {
        'Accept-Encoding': 'gzip',
        Authorization: authToken,
        ...segment && {Cookie: `vtex_segment=${segment}`},
      } : {
        'Accept-Encoding': 'gzip',
        'Proxy-Authorization': authToken,
        'X-Vtex-Use-Https': 'true',
        ...segment && {Cookie: `vtex_segment=${segment}`},
      }

    forEachObjIndexed((value: string, header) => request.headers.set(header, value), headers)
  }

  private productSearchUrl = ({
    query = '',
    category = '',
    specificationFilters,
    priceRange = '',
    collection = '',
    salesChannel = '',
    orderBy = '',
    from = 0,
    to = 9,
    map = ''
  }: ProductsArgs) => {
    const sanitizedQuery = encodeURIComponent(decodeURIComponent(query).trim())
    return (
      `/pub/products/search/${sanitizedQuery}?${category && !query && `&fq=C:/${category}/`}${(specificationFilters && specificationFilters.length > 0 && specificationFilters.map(filter => `&fq=${filter}`)) || ''}${priceRange && `&fq=P:[${priceRange}]`}${collection && `&fq=productClusterIds:${collection}`}${salesChannel && `&fq=isAvailablePerSalesChannel_${salesChannel}:1`}${orderBy && `&O=${orderBy}`}${map && `&map=${map}`}${from > -1 && `&_from=${from}`}${to > -1 && `&_to=${to}`}`
    )
  }
}
