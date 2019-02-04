import { parse } from 'cookie'
import { equals, path } from 'ramda'
import { appendToCookie } from '../../utils'

import { SessionFields } from '../session/sessionResolver'

export const CHECKOUT_COOKIE = 'checkout.vtex.com'

interface GenericObject { [key: string]: any }

const checkoutCookieFormat = (orderFormId: string) => `${CHECKOUT_COOKIE}=__ofid=${orderFormId}`

const getOrderFormIdFromCookie = (cookie): string | null => {
  const cookieParsed = parse(cookie)
  return cookieParsed[CHECKOUT_COOKIE] && cookieParsed[CHECKOUT_COOKIE].split('=')[1]
}

/**
 * After doing changes to the OrderForm, this keeps orderForm and session synced.
 * Currently checks the orderFormId and address saved
 */

export const syncCheckoutAndSessionPostChanges = async (sessionData: SessionFields, orderForm: GenericObject, ctx: Context): Promise<GenericObject> => {
  const orderFormAddress = path(['shippingData', 'selectedAddresses', '0'], orderForm)
  const newOrderForm = await syncOrderFormAndSessionAddress(orderFormAddress, orderForm.orderFormId, sessionData.address, ctx)
  await syncOrderFormAndSessionOrderFormId(orderForm.orderFormId, sessionData.orderFormId, ctx)
  return newOrderForm || orderForm
}

const syncOrderFormAndSessionAddress = async (
  orderFormAddress: GenericObject | null, 
  orderFormId: string, 
  sessionAddress: GenericObject | null, 
  ctx: Context,
  ): Promise<object | null> => {
  const {dataSources: {session, checkout}} = ctx
  if (!orderFormAddress && sessionAddress) {
    return checkout.updateOrderFormShipping(orderFormId, { clearAddressIfPostalCodeNotFound: false, selectedAddresses: [sessionAddress] })
  }

  if (orderFormAddress && !equals(orderFormAddress, sessionAddress)) {
    await session.updateSession('address', orderFormAddress)
  }
  return null
}

const syncOrderFormAndSessionOrderFormId = async (orderFormId: string, sessionOrderFormId: string | null, ctx: Context) => {
  const {dataSources: {session}} = ctx
  if (!sessionOrderFormId || sessionOrderFormId !== orderFormId) {
    // Saving orderFormId on session
    await session.updateSession('orderFormId', orderFormId)
  }
}

/**
 * Checks if there is a cookie containing the current checkout id. If there is one at the session, insert it into the cookies
 */

export const syncCheckoutAndSessionPreCheckout = (sessionData: SessionFields, ctx: Context) => {
  const {request: { headers: { cookie } }} = ctx
  const checkoutOrderFormId = getOrderFormIdFromCookie(cookie)
  if (sessionData.orderFormId && !checkoutOrderFormId) {
    appendToCookie(ctx, checkoutCookieFormat(sessionData.orderFormId))
  }
}