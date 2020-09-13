function distinct<T>(value: T, index: number, self: T[]) {
  return self.indexOf(value) === index
}

export const getSimulationPayloads = (items: Item[], priceTable?: string, regionId?: string) => {
  const payloadItems = items.map((item) => {
    return item.sellers.map((seller) => {
      return {
        id: item.itemId,
        quantity: 1,
        seller: seller.sellerId
      } as PayloadItem
    })
  }).reduce((acc, val) => acc.concat(val), []).filter(distinct)

  return payloadItems.map((item) => {
    return {
      priceTables: priceTable ? [priceTable] : undefined,
      items: [item],
      shippingData: { logisticsInfo: [{ regionId }] }
    }
  })
}


interface OrderFormItemBySeller {
  [sellerId: string]: OrderFormItem & { paymentData: any }
}

export interface OrderFormItemBySellerById {
  [skuId: string]: OrderFormItemBySeller
}


export const fillSearchItemWithSimulation = (item: Item, orderFormItems: OrderFormItemBySeller) => {
  if (orderFormItems) {
    item.sellers.forEach((seller) => {
      const orderFormItem = orderFormItems[seller.sellerId]

      if (orderFormItem == null) {
        console.warn(`Product ${item.itemId} is unavailable for seller ${seller.sellerId}`)
        return
      }

      seller.commertialOffer = {} as CommertialOffer
      seller.commertialOffer.Price = orderFormItem.price / 100
      seller.commertialOffer.PriceValidUntil = orderFormItem.priceValidUntil
      seller.commertialOffer.ListPrice = orderFormItem.listPrice / 100

      const installmentOptions = orderFormItem?.paymentData?.installmentOptions || []

      const [installmentOption] = installmentOptions

      if (!installmentOption) {
        return
      }
      const { installments } = installmentOption

      const correctInstallment = installments.reduce((previous: any, current: any) => {
        if (previous.hasInterestRate && !current.hasInterestRate) {
          return current
        }

        if ((previous.hasInterestRate === current.hasInterestRate) && current.count > previous.count) {
          return current
        }

        return previous
      })

      seller.commertialOffer.Installments = [{
        Value: correctInstallment.value / 100,
        InterestRate: correctInstallment.interestRate,
        TotalValuePlusInterestRate: correctInstallment.total / 100,
        NumberOfInstallments: correctInstallment.count,
      }] as Installment[]
    })
  }

  return item
}
