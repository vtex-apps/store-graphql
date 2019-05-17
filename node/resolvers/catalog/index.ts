import { NotFoundError, ResolverWarning, UserInputError } from '@vtex/api'
import { all, map as PromiseMap } from 'bluebird'
import {
  compose,
  equals,
  find,
  head,
  last,
  path,
  prop,
  split,
  test,
  toLower,
  zip,
} from 'ramda'

import { toSearchTerm, toCategoryIOMessage } from '../../utils/ioMessage'
import { resolvers as autocompleteResolvers } from './autocomplete'
import { resolvers as brandResolvers } from './brand'
import { resolvers as categoryResolvers } from './category'
import { resolvers as discountResolvers } from './discount'
import { resolvers as facetsResolvers } from './facets'
import { resolvers as itemMetadataResolvers } from './itemMetadata'
import { resolvers as itemMetadataUnitResolvers } from './itemMetadataUnit'
import { resolvers as offerResolvers } from './offer'
import { resolvers as productResolvers } from './product'
import { resolvers as recommendationResolvers } from './recommendation'
import { resolvers as searchResolvers } from './search'
import { resolvers as skuResolvers } from './sku'
import { CatalogSlugify } from './slug'

interface SearchContext {
  brand: string | null
  category: string | null
  contextKey: string
}

interface SearchContextParams {
  brand: string
  department: string
  category: string
  subcategory: string
}

const getBrandFromSlug = async (brandSlug: string, {dataSources:{catalog}}: Context)  => {
  const brands = await catalog.brands()
  return <Brand>find(
    compose(
      equals(brandSlug),
      toLower,
      CatalogSlugify,
      prop('name') as any
    ),
    brands
  )
}

const findClusterNameFromId = (products: Product[], clusterId: string) => {
  const productWithCluster = products.find(({ productClusters }) => !!productClusters[clusterId])
  return productWithCluster && productWithCluster.productClusters[clusterId]
}

const buildBreadCrumb = async ({ query, map }: ProductsArgs, products: Product[], ctx: Context) => {
  const {clients: {segment}} = ctx
  if (map === 'ft') {
    return [{ name: query, href: null }]
  }
  const queryAndMap = zip(
    query
      .toLowerCase()
      .split('/')
      .map(decodeURIComponent),
    map.split(',')
  )
  const queryArray = query.split('/')
  const mapArray = map.split(',')
  const categoriesSearched = queryAndMap.filter(([_, m]) => m === 'c').map(([q]) => q)
  const categories = await queries.categories({}, { treeLevel: categoriesSearched.length }, ctx)
  const findNameAndLink = async ([queryUnit, mapUnit]: [string, string], index: number) => {
    const isLast = index === queryAndMap.length - 1
    let name = queryArray[index]
    if (mapUnit === 'c') {
      const queryPosition = categoriesSearched.findIndex(cat => cat === queryUnit)
      const category = findInTree(categories, categoriesSearched.slice(0, queryPosition + 1))
      if (category) {
        const nameIoMessage = await toCategoryIOMessage('name')(segment, category.name, category.id)
        name = nameIoMessage.content
      }
      // if cant find a category, we should try to see if its a product cluster
      const clusterName = findClusterNameFromId(products, queryUnit)
      name = clusterName || name
    }
    if (mapUnit === 'b') {
      const brand = await getBrandFromSlug(toLower(queryUnit), ctx) || {}
      name = brand.name || name
    }
    const href = isLast ? null : '/' + queryArray.slice(0, index + 1).join('/') + '?map=' + mapArray.slice(0, index + 1)
    return { name, href }
  }

  return PromiseMap(queryAndMap, findNameAndLink)
}

/**
 * It will extract the slug from the HREF in the item
 * passed as parameter.
 *
 * That is needed once the API provide only the old link
 * (from CMS portal) to access the product page, nothing
 * more.
 *
 * HREF provided:
 * https://portal.vtexcommercestable.com.br/:slug/p
 *
 * @param item The item to extract the information
 */
export const extractSlug = (item: any) => {
  const href = split('/', item.href)
  return item.criteria ? `${href[3]}/${href[4]}` : href[3]
}

const lastSegment = compose<string, string[], string>(
  last,
  split('/')
)

function findInTree(tree: Category[], values: string[], index = 0): Category | null {
  for (const node of tree) {
    const slug = lastSegment(node.url)
    if (slug.toUpperCase() === values[index].toUpperCase()) {
      if (index === values.length - 1) {
        return node
      }
      return findInTree(node.children, values, index + 1)
    }
  }
  return null
}
/** Get Category metadata for the search/productSearch query
 *
 */
const categoryMetaData = async (_: any, args: ProductsArgs, ctx: any): Promise<Metadata> => {
  const { query } = args
  const category = findInTree(
    await queries.categories(_, { treeLevel: query.split('/').length }, ctx),
    query.split('/')
  ) || {}
  return {
    metaTagDescription: path(['MetaTagDescription'], category),
    titleTag: path(['Title'], category) || path(['Name'], category),
  }
}
/** Get brand metadata for the search/productSearch query
 *
 */
const brandMetaData = async (_: any, args: ProductsArgs, ctx: any): Promise<Metadata> => {
  const brandSlug = toLower(last(args.query.split('/')) || '')
  const brand = getBrandFromSlug(brandSlug, ctx) || {}
  return {
    metaTagDescription: path(['metaTagDescription'], brand),
    titleTag: path(['title'], brand) || path(['name'], brand),
  }
}

/**
 * Get metadata of category/brand APIs
 *
 * @param _
 * @param args
 * @param ctx
 */
const searchMetaData = async (_: any, args: ProductsArgs, ctx: any) => {
  const { map } = args
  const lastMap = last(map.split(','))

  if (lastMap === 'c') {
    return categoryMetaData(_, args, ctx)
  }
  if (lastMap === 'b') {
    return brandMetaData(_, args, ctx)
  }
  return { titleTag: null, metaTagDescription: null }
}

/** TODO: This method should be removed in the next major.
 * @author Ana Luiza
 */
async function getProductBySlug(slug: string, catalog: any) {
  const products = await catalog.product(slug)
  if (products.length > 0) {
    return head(products)
  }
  throw new NotFoundError('No product was found with requested sku')
}

const translateToStoreDefaultLanguage = async (clients: Context['clients'], term: string): Promise<string> => {
  const { segment, messages } = clients
  const [{cultureInfo: to}, {cultureInfo: from}] = await all([
    segment.getSegmentByToken(null),
    segment.getSegment()
  ])
  return from && from !== to
    ? messages.translate(to, [toSearchTerm(term, from)]).then(head)
    : term
}

export const fieldResolvers = {
  ...autocompleteResolvers,
  ...brandResolvers,
  ...categoryResolvers,
  ...facetsResolvers,
  ...itemMetadataResolvers,
  ...itemMetadataUnitResolvers,
  ...offerResolvers,
  ...discountResolvers,
  ...productResolvers,
  ...recommendationResolvers,
  ...searchResolvers,
  ...skuResolvers,
}

export const queries = {
  autocomplete: async (_: any, args: any, ctx: Context) => {
    const {
      dataSources: { catalog },
      clients,
    } = ctx
    const translatedTerm = await translateToStoreDefaultLanguage(clients, args.searchTerm)
    const { itemsReturned } = await catalog.autocomplete({
      maxRows: args.maxRows,
      searchTerm: translatedTerm,
    })
    return {
      cacheId: args.searchTerm,
      itemsReturned,
    }
  },

  facets: async (_: any, { facets, query, map, hideUnavailableItems }: FacetsArgs, ctx: Context) => {
    const {
      dataSources: { catalog },
      clients,
    } = ctx
    let result
    const translatedQuery = await translateToStoreDefaultLanguage(clients, query)
    const segmentData = ctx.vtex.segment
    const salesChannel = segmentData && segmentData.channel.toString() || ''

    const unavailableString =
       hideUnavailableItems ? `&fq=isAvailablePerSalesChannel_${salesChannel}:1` : ''
    if (facets) {
      result = await catalog.facets(facets)
    } else {
      result = await catalog.facets(`${translatedQuery}?map=${map}${unavailableString}`)
    }
    result.queryArgs = {
      query: translatedQuery,
      map
    }
    return result
  },

  product: async (_: any, args: any, ctx: Context) => {
    const {
      dataSources: { catalog },
    } = ctx
    // TODO this is only for backwards compatibility. Should be removed in the next major.
    if (args.slug) {
      return getProductBySlug(args.slug, catalog)
    }

    const { field, value } = args.identifier
    let products = []

    switch (field) {
      case 'id':
        products = await catalog.productById(value)
        break
      case 'slug':
        products = await catalog.product(value)
        break
      case 'ean':
        products = await catalog.productByEan(value)
        break
      case 'reference':
        products = await catalog.productByReference(value)
        break
      case 'sku':
        products = await catalog.productBySku([value])
        break
    }

    if (products.length > 0) {
      return head(products)
    }

    throw new NotFoundError(`No product was found with requested ${field}`)
  },

  products: async (_: any, args: any, ctx: Context) => {
    const {
      dataSources: { catalog },
    } = ctx
    const queryTerm = args.query
    if (queryTerm == null || test(/[?&[\]=]/, queryTerm)) {
      throw new UserInputError(
        `The query term contains invalid characters. query=${queryTerm}`
      )
    }
    return catalog.products(args)
  },

  productSearch: async (_: any, args: ProductsArgs, ctx: Context) => {
    const {
      dataSources: { catalog },
      clients,
    } = ctx
    const query = await translateToStoreDefaultLanguage(clients, args.query)
    const translatedArgs = {
      ...args,
      query,
    }
    const products = await queries.products(_, translatedArgs, ctx)
    const recordsFiltered = await catalog.productsQuantity(translatedArgs)
    const { titleTag, metaTagDescription } = await searchMetaData(
      _,
      translatedArgs,
      ctx
    )
    const breadcrumb = await buildBreadCrumb(args, products, ctx)
    
    return {
      titleTag,
      metaTagDescription,
      products,
      recordsFiltered,
      breadcrumb,
    }
  },

  brand: async (_: any, { id }: {id?: number}, { dataSources: { catalog } }: Context) => {
    const brands = await catalog.brands()
    const brand = find(
      compose(
        equals(id),
        prop('id') as any
      ),
      brands
    )
    if (!brand) {
      throw new NotFoundError(`Brand not found`)
    }
    return brand
  },

  brands: async (_: any, __: any, { dataSources: { catalog } }: Context) =>
    catalog.brands(),

  category: async (
    _: any,
    { id }: { id?: number },
    { dataSources: { catalog } }: Context
  ) => {
    if (id == null) {
      throw new ResolverWarning(`No category ID provided`)
    }
    return catalog.category(id)
  },

  categories: async (
    _: any,
    { treeLevel }: { treeLevel: number },
    { dataSources: { catalog } }: Context
  ) => catalog.categories(treeLevel),

  /** TODO: This method should be removed in the next major.
   * @author Bruno Dias
   */
  search: async (_: any, args: any, ctx: Context) => {
    const { map, query } = args

    if (query == null || map == null) {
      throw new UserInputError('Search query/map cannot be null')
    }

    const { titleTag, metaTagDescription }: any = await searchMetaData(
      _,
      args,
      ctx
    )

    return {
      metaTagDescription,
      queryArgs: args,
      titleTag,
    }
  },

  searchContextFromParams: async (
    _: any,
    args: SearchContextParams,
    { dataSources: { catalog } }: Context
  ) => {
    const response: SearchContext = {
      brand: null,
      category: null,
      contextKey: 'search',
    }

    if (args.brand) {
      const brands = await catalog.brands()
      const found = brands.find(brand => brand.isActive && CatalogSlugify(brand.name) === args.brand)
      response.brand = found ? found.id : null
    }

    if (args.department) {
      const departments = await catalog.categories(2)
      let found

      found = departments.find((department) =>
        department.url.endsWith(`/${args.department.toLowerCase()}`)
      )
      if (args.category && found) {
        found = found.children.find(category =>
          category.url.endsWith(`/${args.category.toLowerCase()}`)
        )
      }

      if (args.subcategory && found) {
        found = found.children.find(subcategory =>
          subcategory.url.endsWith(`/${args.subcategory.toLowerCase()}`)
        )
      }

      response.category = found ? found.id : null
    }

    return response
  },
}
