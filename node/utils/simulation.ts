const ALLOWED_TEASER_TYPES = ["Catalog", "Profiler", "ConditionalPrice"]

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
  orderFormItem: OrderFormItem & { paymentData: any, ratesAndBenefitsData: RatesAndBenefitsData }
) => {
  const commertialOffer = {
    Price: orderFormItem.sellingPrice / 100,
    PriceValidUntil: orderFormItem.priceValidUntil,
    ListPrice: orderFormItem.listPrice / 100,
    PriceWithoutDiscount: orderFormItem.price / 100,
    AvailableQuantity: orderFormItem?.availability === 'available' ? 10000 : 0,
    Teasers: getTeasers(orderFormItem.ratesAndBenefitsData),
    DiscountHighLight: getDiscountHighLights(orderFormItem.ratesAndBenefitsData)
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
        Name: generatePaymentName(installment.interestRate, installmentOption.paymentName, installment.count)
      } as Installment)
    })
  )

  return {
    sellerId: orderFormItem.id,
    commertialOffer,
  }
}

const getTeasers = (ratesAndBenefitsData: RatesAndBenefitsData) => {
  if (!ratesAndBenefitsData) {
    return []
  }

  return ratesAndBenefitsData.teaser
    .filter((teaser: any) => ALLOWED_TEASER_TYPES.includes(teaser.teaserType))
    .map((teaser: any) => ({"<Name>k__BackingField": teaser.name, ...teaser}))
}


const getDiscountHighLights = (ratesAndBenefitsData: RatesAndBenefitsData) => {
  if (!ratesAndBenefitsData) {
    return []
  }

  return ratesAndBenefitsData.rateAndBenefitsIdentifiers
    .filter((rateAndBenefitsIdentifier: any) => rateAndBenefitsIdentifier.featured)
    .map((rateAndBenefitsIdentifier: any) => ({"<Name>k__BackingField": rateAndBenefitsIdentifier.name, ...rateAndBenefitsIdentifier}))
}

const generatePaymentName = (interestRate: number | null, paymentSystemName: string | null, numberOfInstallments: number) => {
  if (interestRate === null) {
    return paymentSystemName
  } else if (interestRate == 0) {
    return `${paymentSystemName} ${numberOfInstallments === 1 ? 'à vista' : `${numberOfInstallments} vezes sem juros`}`
  } else {
    return `${paymentSystemName} ${numberOfInstallments === 1 ? 'à vista com juros' : `${numberOfInstallments} vezes com juros`}`
  }
}
