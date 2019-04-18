import { HttpClient, HttpClientFactory, IODataSource, LRUCache, RequestConfig } from '@vtex/api'
import { stringify } from 'qs'
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

interface AutocompleteArgs {
  maxRows: string
  searchTerm: string
}

const memoryCache = new LRUCache<string, any>({max: 2000})

metrics.trackCache('catalog', memoryCache)

const inflightKey = ({baseURL, url, params, headers}: RequestConfig) => {
  return baseURL! + url! + stringify(params, {arrayFormat: 'repeat', addQueryPrefix: true}) + `&segmentToken=${headers['x-vtex-segment']}`
}

const forProxy: HttpClientFactory = ({context, options}) => context &&
  HttpClient.forWorkspace('catalog-api-proxy.vtex', context, {...options, headers: {
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

  public brandSearch = (query: string = '') =>
    this.get(`/pub/brand/list/${query}`)

  public categories = (treeLevel: number) => this.get(
    `/pub/category/tree/${treeLevel}/`,
    {metric: 'catalog-categories'}
  )

  public categorySearch = (query: string = '', parentId: string = '') =>
    this.get(`/pub/category/list?filter=${query}&parent=${parentId}`)

  public collectionSearch = async (query: string = '') => {
    const {
      vtex: { authToken, account, workspace },
      cookies
    } = this.context
    const clientAuth = cookies.get('VtexIdclientAutCookie')
    /* TODO: use this.context.vtex.region in getting these data */
    const { data } = await http.get(
      `http://${account}.vtexcommercestable.com.br/api/catalog_system${this.collectionsUrl(
        query
      )}`,
      {
        headers: {
          'Proxy-Authorization': authToken,
          VtexIdclientAutCookie: clientAuth
        }
      }
    )

    return data.items
  }

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

  public autocomplete = ({maxRows, searchTerm}: AutocompleteArgs) => this.get(
    `/buscaautocomplete?maxRows=${maxRows}&productNameContains=${encodeURIComponent(searchTerm)}`,
    {metric: 'catalog-autocomplete'}
  )

  private get = <T = any>(url: string, config: RequestConfig = {}) => {
    const segmentData: SegmentData | undefined = (this.context! as CustomIOContext).segment
    const { channel: salesChannel = '' } = segmentData || {}

    config.params = {
      ...config.params,
      ...!!salesChannel && {sc: salesChannel},
    }

    config.inflightKey = inflightKey

    return this.http.get<T>(`/proxy/catalog${url}`, config)
  }

  private getRaw = <T = any>(url: string, config: RequestConfig = {}) => {
    const segmentData: SegmentData | undefined = (this.context! as CustomIOContext).segment
    const { channel: salesChannel = '' } = segmentData || {}

    config.params = {
      ...config.params,
      ...!!salesChannel && {sc: salesChannel},
    }

    config.inflightKey = inflightKey

    return this.http.getRaw<T>(`/proxy/catalog${url}`, config)
  }

  private collectionsUrl = (query: string) =>
    `/pvt/collection/search/${query}?pageSize=50`

  private productSearchUrl = ({
    query = '',
    category = '',
    specificationFilters = [],
    priceRange = '',
    collection = '',
    salesChannel = '',
    orderBy = '',
    from = 0,
    to = 9,
    map = '',
  }: ProductsArgs) => {
    const BASE_URL = '/pub/products/search/'

    const sanitizedQuery = encodeURIComponent(decodeURIComponent(query).trim())

    let queryString = '?'

    if (category && !query) {
      queryString += `fq=C:/${category}/&`
    }

    queryString += specificationFilters.reduce(
      (acc, currFilter) => acc + `fq=${currFilter}&`,
      ''
    )

    if (priceRange) {
      queryString += `fq=P:[${priceRange}]&`
    }

    if (collection) {
      queryString += `fq=productClusterIds:${collection}&`
    }

    if (salesChannel) {
      queryString += `fq=isAvailablePerSalesChannel_${salesChannel}:1&`
    }

    if (orderBy) {
      queryString += `O=${orderBy}&`
    }

    if (map) {
      queryString += `map=${map}&`
    }

    if (from > -1) {
      queryString += `_from=${from}&`
    }

    if (to > -1) {
      queryString += `_to=${to}&`
    }

    queryString = queryString.slice(0, queryString.length - 1)

    return `${BASE_URL}${sanitizedQuery}${queryString}`
  }
}
