import httpResolver from './httpResolver'
import paths from './paths'
import {profileCustomHeaders, profileResolver} from './profileResolver'
import {merge} from 'ramda'

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
  Mutation: {
    addItem: httpResolver({
      method: 'POST',
      enableCookies: true,
      url: (_, {orderFormId}, ctx) => paths(ctx.account).addItem(orderFormId),
      data: (_, {items}) => ({ orderItems: items, expectedOrderFormSections: ['items'] }),
    }),
    cancelOrder: httpResolver({
      method: 'POST',
      enableCookies: true,
      url: (_, {orderFormId}, ctx) => paths(ctx.account).cancelOrder(orderFormId),
      data: (_, {reason}) => ({ reason }),
      callback: () => ({ success: true }),
    }),
    updateItems: httpResolver({
      method: 'POST',
      enableCookies: true,
      url: (_, {orderFormId}, ctx) => paths(ctx.account).updateItems(orderFormId),
      data: (_, {items}) => ({ orderItems: items, expectedOrderFormSections: ['items'] }),
    }),
    updateProfile: httpResolver({
      method: 'PATCH',
      url: (_, {id}, ctx) => paths(ctx.account).profile.profile(id),
      data: (_, {fields}) => merge({}, fields),
      headers: profileCustomHeaders,
      callback: ({id, fields}) => merge({id}, fields),
    }),
    updateAddress: httpResolver({
      method: 'PATCH',
      url: (_, {id}, ctx) => paths(ctx.account).profile.address(id),
      data: (_, {fields}) => merge({}, fields),
      headers: profileCustomHeaders,
      callback: ({id, fields}) => merge({id}, fields),
    }),
    createAddress: httpResolver({
      method: 'PATCH',
      url: (_, args, ctx) => paths(ctx.account).profile.address(''),
      data: (_, {fields}) => merge({}, fields),
      headers: profileCustomHeaders,
      callback: ({id, fields}) => merge({id}, fields),
    }),
    deleteAddress: httpResolver({
      method: 'DELETE',
      url: (_, {id}, ctx) => paths(ctx.account).profile.address(id),
      headers: profileCustomHeaders,
    }),
    setPlaceholder: httpResolver({
      method: 'PUT',
      enableCookies: true,
      url: (_, args, ctx) => paths(ctx.account).placeholders,
      data: (_, {fields}) => merge({}, fields, {settings: JSON.parse(fields.settings)}),
    }),
  },
}
