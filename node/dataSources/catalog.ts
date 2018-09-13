import { RESTDataSource } from 'apollo-datasource-rest'
import { IOContext } from 'colossus'
import { forEachObjIndexed } from 'ramda'
import { withAuthToken } from '../resolvers/headers'

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

const isPlatformGC = account => account.indexOf('gc_') === 0 || account.indexOf('gc-') === 0

/** Catalog API
 * Docs: https://documenter.getpostman.com/view/845/catalogsystem-102/Hs44
 */
export class CatalogDataSource extends RESTDataSource<IOContext> {
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
    const {account} = this.context
    return isPlatformGC(account)
      ? `http://api.gocommerce.com/${account}/search`
      : `http://${account}.vtexcommercestable.com.br/api/catalog_system`
  }

  protected willSendRequest (request) {
    forEachObjIndexed(
      (value, header) => request.headers.set(header, value),
      withAuthToken(request.header)(this.context)
    )
  }
}
