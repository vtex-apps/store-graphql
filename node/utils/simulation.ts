export const getSimulationPayloadsByItem = (
  item: ItemWithSimulationInput,
  priceTable?: string,
  regionId?: string
) => {
  const payloadItems = item.sellers.map((seller) => {
    return {
      id: item.itemId,
      quantity: 1,
      seller: seller.sellerId,
    } as PayloadItem
  })

  return payloadItems.map((item) => {
    return {
      priceTables: priceTable ? [priceTable] : undefined,
      items: [item],
      shippingData: { logisticsInfo: [{ regionId }] },
    }
  })
}

export const orderFormItemToSeller = (
  orderFormItem: OrderFormItem & { paymentData: any }
) => {
  const commertialOffer = {
    Price: orderFormItem.sellingPrice / 100,
    PriceValidUntil: orderFormItem.priceValidUntil,
    ListPrice: orderFormItem.listPrice / 100,
    PriceWithoutDiscount: orderFormItem.price / 100,
  } as CommertialOffer

  const installmentOptions =
    orderFormItem?.paymentData?.installmentOptions || []

  commertialOffer.Installments = []

  installmentOptions.forEach((installmentOption: InstallmentOption) =>
    installmentOption.installments.map((installment) => {
      commertialOffer.Installments.push({
        Value: installment.value / 100,
        InterestRate: installment.interestRate,
        TotalValuePlusInterestRate: installment.total / 100,
        NumberOfInstallments: installment.count,
        PaymentSystemName: installmentOption.paymentName,
      } as Installment)
    })
  )

  return {
    sellerId: orderFormItem.id,
    commertialOffer,
  }
}
