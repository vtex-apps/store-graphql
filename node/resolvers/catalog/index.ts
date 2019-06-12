import { NotFoundError, ResolverWarning, UserInputError } from '@vtex/api'
import { all } from 'bluebird'
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
} from 'ramda'

import { toSearchTerm } from '../../utils/ioMessage'
import { resolvers as autocompleteResolvers } from './autocomplete'
import { resolvers as brandResolvers } from './brand'
import { resolvers as categoryResolvers } from './category'
import { resolvers as discountResolvers } from './discount'
import { resolvers as facetsResolvers } from './facets'
import { resolvers as itemMetadataResolvers } from './itemMetadata'
import { resolvers as itemMetadataUnitResolvers } from './itemMetadataUnit'
import { resolvers as offerResolvers } from './offer'
import { resolvers as productResolvers } from './product'
import { resolvers as productSearchResolvers } from './productSearch'
import { resolvers as recommendationResolvers } from './recommendation'
import { resolvers as searchResolvers } from './search'
import { resolvers as breadcrumbResolvers } from './searchBreadcrumb'
import { resolvers as skuResolvers } from './sku'
import { catalogSlugify, Slugify } from './slug'
import {
  CatalogCrossSellingTypes,
  findCategoryInTree,
  getBrandFromSlug
} from './utils'

interface SearchContext {
  brand: string | null
  category: string | null
  contextKey: string
}

interface SearchContextParams {
  brand?: string
  department?: string
  category?: string
  subcategory?: string
}

interface ProductIndentifier {
  field: 'id' | 'slug' | 'ean' | 'reference' | 'sku'
  value: string
}

interface ProductArgs {
  slug?: string
  identifier?: ProductIndentifier
}

enum CrossSellingInput {
  view = 'view',
  buy = 'buy',
  similars = 'similars',
  viewAndBought = 'viewAndBought',
  suggestions = 'suggestions',
  accessories = 'accessories',
}

interface ProductRecommendationArg {
  identifier?: ProductIndentifier
  type?: CrossSellingInput
}

interface ProductsByIdentifierArgs {
  field: 'id' | 'ean' | 'reference' | 'sku'
  values: [string]
}

const inputToCatalogCrossSelling = {
  [CrossSellingInput.buy]: CatalogCrossSellingTypes.whoboughtalsobought,
  [CrossSellingInput.view]: CatalogCrossSellingTypes.whosawalsosaw,
  [CrossSellingInput.similars]: CatalogCrossSellingTypes.similars,
  [CrossSellingInput.viewAndBought]: CatalogCrossSellingTypes.whosawalsobought,
  [CrossSellingInput.accessories]: CatalogCrossSellingTypes.accessories,
  [CrossSellingInput.suggestions]: CatalogCrossSellingTypes.suggestions,
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

/** Get Category metadata for the search/productSearch query
 *
 */
const categoryMetaData = async (
  _: any,
  args: SearchArgs,
  ctx: Context
): Promise<Metadata> => {
  const { query } = args
  const category =
    findCategoryInTree(
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
const brandMetaData = async (
  _: any,
  args: SearchArgs,
  ctx: Context
): Promise<Metadata> => {
  const brandSlug = toLower(last(args.query.split('/')) || '')
  const brand = (await getBrandFromSlug(brandSlug, ctx)) || {}
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
const getSearchMetaData = async (_: any, args: SearchArgs, ctx: Context) => {
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
async function getProductBySlug(
  slug: string,
  catalog: Context['clients']['catalog']
) {
  const products = await catalog.product(slug)
  if (products.length > 0) {
    return head(products)
  }
  throw new NotFoundError('No product was found with requested sku')
}

const translateToStoreDefaultLanguage = async (
  clients: Context['clients'],
  term: string
): Promise<string> => {
  const { segment, messages } = clients
  const [{ cultureInfo: to }, { cultureInfo: from }] = await all([
    segment.getSegmentByToken(null),
    segment.getSegment(),
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
  ...breadcrumbResolvers,
  ...productSearchResolvers,
}

export const queries = {
  autocomplete: async (_: any, args: any, ctx: Context) => {
    const {
      clients: { catalog },
      clients,
    } = ctx
    const translatedTerm = await translateToStoreDefaultLanguage(
      clients,
      args.searchTerm
    )
    const { itemsReturned } = await catalog.autocomplete({
      maxRows: args.maxRows,
      searchTerm: translatedTerm,
    })
    return {
      cacheId: args.searchTerm,
      itemsReturned,
    }
  },

  facets: async (
    _: any,
    { facets, query, map, hideUnavailableItems }: FacetsArgs,
    ctx: Context
  ) => {
    const {
      clients: { catalog },
      clients,
    } = ctx
    let result
    const translatedQuery = await translateToStoreDefaultLanguage(
      clients,
      query
    )
    const segmentData = ctx.vtex.segment
    const salesChannel = (segmentData && segmentData.channel.toString()) || ''

    const unavailableString = hideUnavailableItems
      ? `&fq=isAvailablePerSalesChannel_${salesChannel}:1`
      : ''
    if (facets) {
      result = await catalog.facets(facets)
    } else {
      result = await catalog.facets(
        `${translatedQuery}?map=${map}${unavailableString}`
      )
    }
    result.queryArgs = {
      query: translatedQuery,
      map,
    }
    return result
  },

  product: async (_: any, args: ProductArgs, ctx: Context) => {
    const {
      clients: { catalog },
    } = ctx
    // TODO this is only for backwards compatibility. Should be removed in the next major.
    if (args.slug) {
      return getProductBySlug(args.slug, catalog)
    }
    if (!args.identifier) {
      throw new UserInputError('No product identifier provided')
    }

    const { field, value } = args.identifier
    let products = [] as Product[]

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
      clients: { catalog },
    } = ctx
    const queryTerm = args.query
    if (queryTerm == null || test(/[?&[\]=]/, queryTerm)) {
      throw new UserInputError(
        `The query term contains invalid characters. query=${queryTerm}`
      )
    }
    return catalog.products(args)
  },

  productsByIdentifier: async (
    _: any,
    args: ProductsByIdentifierArgs,
    ctx: Context
  ) => {
    const {
      clients: { catalog },
    } = ctx

    let products = [] as Product[]
    const { field, values } = args

    switch (field) {
      case 'id':
        products = await catalog.productsById(values)
        break
      case 'ean':
        products = await catalog.productsByEan(values)
        break
      case 'reference':
        products = await catalog.productsByReference(values)
        break
      case 'sku':
        products = await catalog.productBySku(values)
        break
    }

    if (products.length > 0) {
      return products
    }

    throw new NotFoundError(`No products were found with requested ${field}`)
  },

  productSearch: async (_: any, args: SearchArgs, ctx: Context) => {
    const {
      clients,
      clients: { catalog },
    } = ctx
    const queryTerm = args.query
    if (queryTerm == null || test(/[?&[\]=]/, queryTerm)) {
      throw new UserInputError(
        `The query term contains invalid characters. query=${queryTerm}`
      )
    }
    const query = await translateToStoreDefaultLanguage(clients, args.query)
    const translatedArgs = {
      ...args,
      query,
    }
    const [productsRaw, searchMetaData] = await all([
      catalog.products(args, true),
      getSearchMetaData(_, translatedArgs, ctx),
    ])
    return {
      translatedArgs,
      searchMetaData,
      productsRaw,
    }
  },

  brand: async (
    _: any,
    { id }: { id?: number },
    { clients: { catalog } }: Context
  ) => {
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

  brands: async (_: any, __: any, { clients: { catalog } }: Context) =>
    catalog.brands(),

  category: async (
    _: any,
    { id }: { id?: number },
    { clients: { catalog } }: Context
  ) => {
    if (id == null) {
      throw new ResolverWarning(`No category ID provided`)
    }
    return catalog.category(id)
  },

  categories: async (
    _: any,
    { treeLevel }: { treeLevel: number },
    { clients: { catalog } }: Context
  ) => catalog.categories(treeLevel),

  /** TODO: This method should be removed in the next major.
   * @author Bruno Dias
   */
  search: async (_: any, args: any, ctx: Context) => {
    const { map, query } = args

    if (query == null || map == null) {
      throw new UserInputError('Search query/map cannot be null')
    }

    const { titleTag, metaTagDescription }: any = await getSearchMetaData(
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
    { clients: { catalog } }: Context
  ) => {
    const response: SearchContext = {
      brand: null,
      category: null,
      contextKey: 'search',
    }

    if (args.brand) {
      const brands = await catalog.brands()

      const compareBrandSlug = (name: string) =>
        toLower(catalogSlugify(name)) === args.brand ||
        toLower(Slugify(name)) === args.brand

      const found = brands.find(
        brand => brand.isActive && compareBrandSlug(brand.name)
      )
      response.brand = found ? found.id : null
    }

    if (args.department) {
      const departments = await catalog.categories(2)

      const compareGenericSlug = ({
        entity,
        url,
      }: {
        entity: 'category' | 'department' | 'subcategory'
        url: string
      }) => {
        const slug = args[entity]

        if (!slug) {
          return false
        }

        return (
          url.endsWith(`/${toLower(catalogSlugify(slug))}`) ||
          url.endsWith(`/${toLower(Slugify(slug))}`)
        )
      }

      let found

      found = departments.find(department =>
        compareGenericSlug({ entity: 'department', url: department.url })
      )

      if (args.category && found) {
        found = found.children.find(category =>
          compareGenericSlug({ entity: 'category', url: category.url })
        )
      }

      if (args.subcategory && found) {
        found = found.children.find(subcategory =>
          compareGenericSlug({ entity: 'subcategory', url: subcategory.url })
        )
      }

      response.category = found ? found.id : null
    }

    return response
  },

  productRecommendations: async (
    _: any,
    { identifier, type }: ProductRecommendationArg,
    ctx: Context
  ) => {
    if (identifier == null || type == null) {
      throw new UserInputError('Wrong input provided')
    }
    const catalogType = inputToCatalogCrossSelling[type]
    let productId = identifier.value
    if (identifier.field !== 'id') {
      const product = await queries.product(_, { identifier }, ctx)
      productId = product!.productId
    }
    return ctx.clients.catalog.crossSelling(productId, catalogType)
  },
}
