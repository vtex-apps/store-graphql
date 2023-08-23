import { SegmentData } from '@vtex/api'

import { calculatePrice } from './calculatePrice'
import { isRegionV1, isUniqueSeller } from './regionV1'
import atob from 'atob'

const ALLOWED_TEASER_TYPES = ['Catalog', 'Profiler', 'ConditionalPrice']

const MARKETPLACE_SELLER_ID = '1'

const getMarketingData = (segment?: SegmentData) => {
  if (
    !segment?.utm_campaign &&
    !segment?.utm_source &&
    !segment?.utmi_campaign &&
    !segment?.campaigns
  ) {
    return
  }

  let marketingData = {}

  if (segment?.utm_campaign) {
    marketingData = {
      utmCampaign: segment?.utm_campaign,
    }
  }

  if (segment?.utm_source) {
    marketingData = {
      ...marketingData,
      utmSource: segment?.utm_source,
    }
  }

  if (segment?.utmi_campaign) {
    marketingData = {
      ...marketingData,
      utmiCampaign: segment?.utmi_campaign,
    }
  }

  if (segment?.campaigns) {
    marketingData = {
      ...marketingData,
      campaigns: [{ id: segment?.campaigns }],
    }
  }

  return marketingData
}

export const getSimulationPayloadsByItem = (
  item: ItemWithSimulationInput,
  segment?: SegmentData,
  regionId?: string,
  useSellerFromRegion?: Boolean
) => {
  const payloadItems = item.sellers.map((seller) => {
    let sellerFromRegion = null
    if (useSellerFromRegion && regionId && seller.sellerId === MARKETPLACE_SELLER_ID) {
      const regionV1 = isRegionV1(regionId)
      const sellerList = regionV1 ? atob(regionId) : null
      if (sellerList) {
        const uniqueSeller = isUniqueSeller(sellerList)
        sellerFromRegion = uniqueSeller ? sellerList.split('SW#')[1] : null
      }
    }
    return {
      id: item.itemId,
      quantity: 1,
      seller: sellerFromRegion ? sellerFromRegion : seller.sellerId,
    } as PayloadItem
  })

  return payloadItems.map((payloadItem) => {
    return {
      priceTables: segment?.priceTables ? [segment.priceTables] : undefined,
      items: [payloadItem],
      shippingData: {
        logisticsInfo: [{ regionId: regionId ?? segment?.regionId }],
      },
      marketingData: getMarketingData(segment),
    }
  })
}

export const orderFormItemToSeller = (
  orderFormItem: OrderFormItem & {
    paymentData: PaymentData
    ratesAndBenefitsData: RatesAndBenefitsData
    logisticsInfo: any[]
  }
) => {
  const unitMultiplier = orderFormItem.unitMultiplier ?? 1

  const [logisticsInfo] = orderFormItem.logisticsInfo

  const sellingPrice =
    orderFormItem.priceDefinition?.calculatedSellingPrice ??
    orderFormItem.sellingPrice

  const { price } = orderFormItem

  const haveUnitMultiplier = unitMultiplier !== 1

  const realPrice = haveUnitMultiplier
    ? calculatePrice(unitMultiplier, sellingPrice, price)
    : sellingPrice

  const commertialOffer = {
    Price: Number((realPrice / 100).toFixed(3)),
    PriceValidUntil: orderFormItem.priceValidUntil,
    ListPrice: orderFormItem.listPrice / 100,
    PriceWithoutDiscount: price / 100,
    Tax: orderFormItem.tax / 100,
    AvailableQuantity:
      orderFormItem?.availability === 'available' &&
      (logisticsInfo ? logisticsInfo.stockBalance : 1)
        ? 10000
        : 0,
    Teasers: getTeasers(orderFormItem.ratesAndBenefitsData),
    DiscountHighLight: getDiscountHighLights(
      orderFormItem.ratesAndBenefitsData
    ),
  } as CommertialOffer

  const installmentOptions =
    orderFormItem?.paymentData?.installmentOptions || []

  commertialOffer.Installments = []

  installmentOptions.forEach((installmentOption: InstallmentOption) =>
    installmentOption.installments.forEach((installment) => {
      commertialOffer.Installments.push({
        Value: installment.value / 100,
        InterestRate: installment.interestRate / 100,
        TotalValuePlusInterestRate: installment.total / 100,
        NumberOfInstallments: installment.count,
        PaymentSystemName: installmentOption.paymentName,
        PaymentSystemGroupName: installmentOption.paymentGroupName,
        Name: generatePaymentName(
          installment.interestRate,
          installmentOption.paymentName,
          installment.count
        ),
      } as Installment)
    })
  )

  return {
    sellerId: orderFormItem.seller,
    commertialOffer,
  }
}

const getTeasers = (ratesAndBenefitsData: RatesAndBenefitsData) => {
  if (!ratesAndBenefitsData) {
    return []
  }

  return ratesAndBenefitsData.teaser
    .filter((teaser: any) => ALLOWED_TEASER_TYPES.includes(teaser.teaserType))
    .map((teaser: any) => ({
      '<Name>k__BackingField': teaser.name,
      ...teaser,
      generalValues: Object.keys(teaser.generalValues).map(
        (objectKey: string) => ({
          key: objectKey,
          value: teaser.generalValues[objectKey],
        })
      ),
    }))
}

const getDiscountHighLights = (ratesAndBenefitsData: RatesAndBenefitsData) => {
  if (!ratesAndBenefitsData) {
    return []
  }

  return ratesAndBenefitsData.rateAndBenefitsIdentifiers
    .filter(
      (rateAndBenefitsIdentifier: any) => rateAndBenefitsIdentifier.featured
    )
    .map((rateAndBenefitsIdentifier: any) => ({
      '<Name>k__BackingField': rateAndBenefitsIdentifier.name,
      ...rateAndBenefitsIdentifier,
      additionalInfo: Object.keys(
        rateAndBenefitsIdentifier.additionalInfo ?? {}
      ).map((objectKey: string) => ({
        key: objectKey,
        value: rateAndBenefitsIdentifier.additionalInfo[objectKey],
      })),
    }))
}

const generatePaymentName = (
  interestRate: number | null,
  paymentSystemName: string | null,
  numberOfInstallments: number
) => {
  if (interestRate === null) {
    return paymentSystemName
  }

  if (interestRate === 0) {
    return `${paymentSystemName} ${
      numberOfInstallments === 1
        ? 'à vista'
        : `${numberOfInstallments} vezes sem juros`
    }`
  }

  return `${paymentSystemName} ${
    numberOfInstallments === 1
      ? 'à vista com juros'
      : `${numberOfInstallments} vezes com juros`
  }`
}
