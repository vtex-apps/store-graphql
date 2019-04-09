import { HttpClient, HttpClientFactory, IODataSource, LRUCache, RequestConfig } from '@vtex/api'
import { SegmentData } from './session'

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

const memoryCache = new LRUCache<string, any>({max: 2000})

metrics.trackCache('catalog', memoryCache)

const forProxy: HttpClientFactory = ({context, options}) => context &&
  HttpClient.forWorkspace('store-graphql.vtex', context, {...options, headers: {
    ... context.segmentToken ? {'x-vtex-segment': context.segmentToken} : null,
  }, memoryCache, metrics})

/** Catalog API
 * Docs: https://documenter.getpostman.com/view/845/catalogsystem-102/Hs44
 */
export class CatalogDataSource extends IODataSource {
  protected httpClientFactory = forProxy

  public product = (slug: string) => this.get(
    `/pub/products/search/${slug && slug.toLowerCase()}/p`,
    {metric: 'catalog-product'}
  )

  public productByEan = (id: string) => this.get(
    `/pub/products/search?fq=alternateIds_Ean=${id}`,
    {metric: 'catalog-productByEan'}
  )

  public productById = (id: string) => this.get(
    `/pub/products/search?fq=productId:${id}`,
    {metric: 'catalog-productById'}
  )

  public productByReference = (id: string) => this.get(
    `/pub/products/search?fq=alternateIds_RefId=${id}`,
    {metric: 'catalog-productByReference'}
  )

  public productBySku = (skuIds: string[]) => this.get(
    `/pub/products/search?${skuIds.map(skuId => `fq=skuId:${skuId}`).join('&')}`,
    {metric: 'catalog-productBySku'}
  )

  public products = (args: ProductsArgs) => this.get(
    this.productSearchUrl(args),
    {metric: 'catalog-products'}
  )

  public productsQuantity = async (args: ProductsArgs) => {
    const {headers: {resources}} = await this.getRaw(this.productSearchUrl(args))
    const quantity = resources.split('/')[1]
    return parseInt(quantity, 10)
  }

  public brands = () => this.get(
    '/pub/brand/list',
    {metric: 'catalog-brands'}
  )

  public categories = (treeLevel: number) => this.get(
    `/pub/category/tree/${treeLevel}/`,
    {metric: 'catalog-categories'}
  )

  public facets = (facets: string = '') => {
    const [path, options] = decodeURI(facets).split('?')
    return this.get(
      `/pub/facets/search/${encodeURI(`${path.trim()}${options ? '?' + options : ''}`)}`,
      {metric: 'catalog-facets'}
    )
  }

  public category = (id: string) => this.get(
    `/pub/category/${id}`,
    {metric: 'catalog-category'}
  )

  public crossSelling = (id: string, type: string) => this.get(
    `/pub/products/crossselling/${type}/${id}`,
    {metric: 'catalog-crossSelling'}
  )

  private get = <T = any>(url: string, config: RequestConfig = {}) => {
    const segmentData: SegmentData | undefined = (this.context! as CustomIOContext).segment
    const { channel: salesChannel = '' } = segmentData || {}
    const [appMajorNumber] = process.env.VTEX_APP_VERSION!.split('.')
    const appMajor = `${appMajorNumber}.x`

    config.params = {
      ...config.params,
      ...!!salesChannel && {sc: salesChannel},
      __v: appMajor,
    }
    return this.http.get<T>(`/proxy/catalog${url}`, config)
  }

  private getRaw = <T = any>(url: string, config: RequestConfig = {}) => {
    const segmentData: SegmentData | undefined = (this.context! as CustomIOContext).segment
    const { channel: salesChannel = '' } = segmentData || {}
    const [appMajorNumber] = process.env.VTEX_APP_VERSION!.split('.')
    const appMajor = `${appMajorNumber}.x`

    config.params = {
      ...config.params,
      ...!!salesChannel && {sc: salesChannel},
      __v: appMajor,
    }
    return this.http.getRaw<T>(`/proxy/catalog${url}`, config)
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
