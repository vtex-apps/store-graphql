import httpResolver from './httpResolver'
import paths from './paths'
import {profileResolver} from './profileResolver'

const facadeHeaders = {'accept': 'application/vnd.vtex.search-api.v0+json'}

export default {
  Query: {
    product: httpResolver({
      url: (_, {slug}, ctx) => paths(ctx.account).product(slug),
      headers: facadeHeaders,
    }),
    products: httpResolver({
      url: (_, args, ctx) => paths(ctx.account).products(args),
      headers: facadeHeaders,
    }),
    category: httpResolver({
      url: (_, {slug}, ctx) => paths(ctx.account).category(slug),
      headers: facadeHeaders,
    }),
    categories: httpResolver({
      url: (_, args, ctx) => paths(ctx.account).categories,
      headers: facadeHeaders,
    }),
    brand: httpResolver({
      url: (_, {slug}, ctx) => paths(ctx.account).brand(slug),
      headers: facadeHeaders,
    }),
    shipping: httpResolver({
      url: (_, {skuId, postalCode}, ctx) => paths(ctx.account).shipping(skuId, postalCode),
    }),
    orderForm: httpResolver({
      method: 'POST',
      enableCookies: true,
      url: (_, args, ctx) => paths(ctx.account).orderForm,
      data: { expectedOrderFormSections: ['items'] },
    }),
    orders: httpResolver({
      enableCookies: true,
      url: (_, args, ctx) => paths(ctx.account).orders,
    }),
    profile: profileResolver,
    autocomplete: httpResolver({
      url: (_, {maxRows, searchTerm}, ctx) => paths(ctx.account).autocomplete(maxRows, searchTerm),
    }),
  },
}
