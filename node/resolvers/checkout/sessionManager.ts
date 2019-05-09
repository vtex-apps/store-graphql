import { equals, path } from 'ramda'

import { getOrderFormIdFromCookie } from '../../utils'
import { SessionFields } from '../session/sessionResolver'

interface GenericObject { [key: string]: any }

/**
 * After doing changes to the OrderForm, this keeps orderForm and session synced.
 * Currently checks the orderFormId and address saved
 */

export const syncCheckoutAndSessionPostChanges = async (sessionData: SessionFields, orderForm: GenericObject, ctx: Context): Promise<GenericObject> => {
  const orderFormAddress: any = path(['shippingData', 'selectedAddresses', '0'], orderForm)
  const newOrderForm = await syncOrderFormAndSessionAddress(orderFormAddress, orderForm.orderFormId, sessionData.address, ctx)
  await syncOrderFormAndSessionOrderFormId(orderForm.orderFormId, (sessionData as any).orderFormId, ctx)
  return newOrderForm || orderForm
}

const isMasked = (str: string) => /\*+/g.test(str)

const syncOrderFormAndSessionAddress = async (
  orderFormAddress: GenericObject | null,
  orderFormId: string,
  sessionAddress: GenericObject | null,
  ctx: Context,
  ): Promise<object | null> => {
  const {dataSources: {session}, clients: { checkout }} = ctx
  if (!orderFormAddress && sessionAddress && !isMasked(sessionAddress.postalCode)) {
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
  const { cookies } = ctx
  const checkoutOrderFormId = getOrderFormIdFromCookie(cookies)
  if (sessionData.orderFormId && !checkoutOrderFormId) {
    ctx.vtex.orderFormId = sessionData.orderFormId
  }
}
