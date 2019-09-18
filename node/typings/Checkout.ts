interface OrderFormMarketingData {
  utmCampaign?: string
  utmMedium?: string
  utmSource?: string
  utmiCampaign?: string
  utmiPart?: string
  utmipage?: string
  marketingTags?: string | string[]
}

interface CheckoutAddress {
  addressType: string
  receiverName: string
  addressId: string
  postalCode: string
  city: string
  state: string
  country: string
  street: string
  number: string
  neighborhood: string
  complement: string
  reference: string | null
  geoCoordinates: [number, number]
}
interface OrderFormItem {
  id: string
  name: string
  detailUrl: string
  imageUrl: string
  productRefId: string
  skuName: string
  quantity: number
  uniqueId: string
  productId: string
  refId: string
  ean: string
  priceValidUntil: string
  price: number
  tax: number
  listPrice: number
  sellingPrice: number
  rewardValue: number
  isGift: boolean
  parentItemIndex: number | null
  parentAssemblyBinding: string | null
  productCategoryIds: string
  priceTags: string[]
  measurementUnit: string
  additionalInfo: {
    brandName: string
    brandId: string
    offeringInfo: any | null
    offeringType: any | null
    offeringTypeId: any | null
  }
  productCategories: Record<string, string>
  seller: string
  sellerChain: string[]
  availability: string
  unitMultiplier: number
}
interface OrderForm {
  orderFormId: string
  salesChannel: string
  loggedIn: boolean
  isCheckedIn: boolean
  storeId: string | null
  checkedInPickupPointId: string | null
  allowManualPrice: boolean
  canEditData: boolean
  userProfileId: string | null
  userType: string | null
  ignoreProfileData: boolean
  value: number
  messages: any[]
  items: OrderFormItem[]
  selectableGifts: any[]
  totalizers: { id: string; name: string; value: number }[]
  shippingData: {
    address: CheckoutAddress
    logisticsInfo: {
      itemIndex: number
      selectedSla: string
      selectedDeliveryChannel: string
      addressId: string
      slas: SLA[]
      shipsTo: string[]
      itemId: string
      deliveryChannels: { id: string }[]
    }[]
    selectedAddresses: CheckoutAddress[]
    availableAddresses: CheckoutAddress[]
    pickupPoints: {
      friendlyName: string
      address: CheckoutAddress
      additionalInfo: string
      id: string
      businessHours: {
        DayOfWeek: number
        OpeningTime: string
        ClosingTime: string
      }[]
    }[]
  }
  clientProfileData: any | null
  paymentData: {
    installmentOptions: {
      paymentSystem: string
      bin: string | null
      paymentName: string | null
      paymentGroupName: string | null
      value: number
      installments: {
        count: number
        hasInterestRate: false
        interestRate: number
        value: number
        total: number
        sellerMerchantInstallments: {
          count: number
          hasInterestRate: false
          interestRate: number
          value: number
          total: number
        }[]
      }[]
    }[]
    paymentSystems: {
      id: string
      name: string
      groupName: string
      validator: {
        regex: string
        mask: string
        cardCodeRegex: string
        cardCodeMask: string
        weights: number[]
        useCvv: boolean
        useExpirationDate: boolean
        useCardHolderName: boolean
        useBillingAddress: boolean
      }
      stringId: string
      template: string
      requiresDocument: boolean
      isCustom: boolean
      description: string | null
      requiresAuthentication: boolean
      dueDate: string
      availablePayments: any | null
    }[]
    payments: any[]
    giftCards: any[]
    giftCardMessages: any[]
    availableAccounts: any[]
    availableTokens: any[]
  }
  marketingData: OrderFormMarketingData | null
  sellers: {
    id: string
    name: string
    logo: string
  }[]
  clientPreferencesData: {
    locale: string
    optinNewsLetter: any | null
  }
  commercialConditionData: any | null
  storePreferencesData: {
    countryCode: string
    saveUserData: boolean
    timeZone: string
    currencyCode: string
    currencyLocale: number
    currencySymbol: string
    currencyFormatInfo: {
      currencyDecimalDigits: number
      currencyDecimalSeparator: string
      currencyGroupSeparator: string
      currencyGroupSize: number
      startsWithCurrencySymbol: boolean
    }
  }
  giftRegistryData: any | null
  openTextField: any | null
  invoiceData: any | null
  customData: any | null
  itemMetadata: {
    items: MetadataItem[]
  }
  hooksData: any | null
  ratesAndBenefitsData: {
    rateAndBenefitsIdentifiers: any[]
    teaser: any[]
  }
  subscriptionData: any | null
  itemsOrdination: any | null
}

interface OrderFormItemInput {
  id?: number
  index?: number
  quantity?: number
  seller?: string
  inputValues: Record<string, string>
  options?: AssemblyOptionInput[]
}

interface AssemblyOptionInput {
  id: string
  quantity: number
  assemblyId: string
  seller: string
  inputValues: Record<string, string>
  options?: AssemblyOptionInput[]
}

interface PayloadItem {
  id: string
  quantity: number
  seller: string
  parentItemIndex?: number | null
  parentAssemblyBinding?: string | null
}

interface SimulationPayload {
  country: string
  items: PayloadItem[]
  postalCode?: string
  isCheckedIn?: boolean
  priceTables?: string[]
  marketingData?: Record<string, string>
}

interface SLA {
  id: string
  deliveryChannel: string
  name: string
  deliveryIds: {
    courierId: string
    warehouseId: string
    dockId: string
    courierName: string
    quantity: number
  }[]
  shippingEstimate: string
  shippingEstimateDate: string | null
  lockTTL: string | null
  availableDeliveryWindows: any[]
  deliveryWindow: string | null
  price: number
  listPrice: number
  tax: number
  pickupStoreInfo: {
    isPickupStore: boolean
    friendlyName: string | null
    address: CheckoutAddress | null
    additionalInfo: any | null
    dockId: string | null
  }
  pickupPointId: string | null
  pickupDistance: number
  polygonName: string | null
}
