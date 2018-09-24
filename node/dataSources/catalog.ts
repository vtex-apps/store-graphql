import { RequestOptions, RESTDataSource } from 'apollo-datasource-rest'
import { ColossusContext } from 'colossus'
import { forEachObjIndexed } from 'ramda'

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
export class CatalogDataSource extends RESTDataSource<ColossusContext> {
  constructor() {
    super()
  }

  public product = (slug: string) => this.get(
    `/pub/products/search/${slug}/p`
  )

  public productByEan = (id: string) => this.get(
    `/pub/products/search?fq=alternateIds_Ean=${id}`
  )

  public productById = (id: string) => this.get(
    `/pub/products/search?fq=productId:${id}`
  )

  public productByReference = (id: string) => this.get(
    `/pub/products/search?fq=alternateIds_RefId=${id}`
  )

  public productBySku = (skuIds: string[]) => this.get(
    `/pub/products/search?${skuIds.map(skuId => `fq=skuId:${skuId}`).join('&')}`
  )

  public products = ({
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
  }: ProductsArgs) => this.get(
    `/pub/products/search/${encodeURIComponent(query)}?${category && !query && `&fq=C:/${category}/`}${(specificationFilters && specificationFilters.length > 0 && specificationFilters.map(filter => `&fq=${filter}`)) || ''}${priceRange && `&fq=P:[${priceRange}]`}${collection && `&fq=productClusterIds:${collection}`}${salesChannel && `&fq=isAvailablePerSalesChannel_${salesChannel}:1`}${orderBy && `&O=${orderBy}`}${map && `&map=${map}`}${from > -1 && `&_from=${from}`}${to > -1 && `&_to=${to}`}`
  )

  public brands = () => this.get(
    `/pub/brand/list`
  )

  public categories = (treeLevel: string) => this.get(
    `/pub/category/tree/${treeLevel}/`
  )

  public facets = (facets: string = '') => this.get(
    `/pub/facets/search/${encodeURI(facets)}`
  )

  public category = (id: string) => this.get(
    `/pub/category/${id}`
  )

  public crossSelling = (id: string, type: string) => this.get(
    `/pub/products/crossselling/${type}/${id}`
  )

  get baseURL() {
    const {vtex: {account, workspace, region}} = this.context
    return `http://store-graphql.vtex.${region}.vtex.io/${account}/${workspace}/proxy/catalog`
  }

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
        'vtex_segment': segment,
      }
    )

    forEachObjIndexed(
      (value: string, header) => request.headers.set(header, value),
      {
        'Accept-Encoding': 'gzip',
        Authorization: authToken,
        Cookie: `vtex_segment=${segment}`,
      }
    )
  }
}
