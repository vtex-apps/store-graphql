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
  receiverName: string | null
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

interface CheckoutAssemblyItem {
  id: string
  inputValues: Record<string, string>
}

interface CheckoutAttachmentOffering {
  name: string
  required: boolean
  schema: Record<string, Record<string, unknown>>
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
  priceTags: PriceTags[]
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
  assemblies: CheckoutAssemblyItem[]
  attachmentOfferings: CheckoutAttachmentOffering[]
  priceDefinition: {
    calculatedSellingPrice: number
    sellingPrices: SellingPrice[]
    total: number
  }
}

interface SellingPrice {
  quantity: number
  value: number
}

interface PriceTags {
  name: string
  value: number
  rawValue: number
  isPercentual: boolean
  identifier: string
}

interface InstallmentOption {
  paymentSystem: string
  paymentName: string
  paymentGroupName: string
  value: number
  bin: string | null
  installments: SimulationInstallment[]
}

interface SimulationInstallment {
  value: number
  interestRate: number
  total: number
  count: number
}

interface PaymentSystem {
  id: number
  name: string
  groupName: string
  validator: Validator
  stringId: string
  template: string
  requiresDocument: boolean
  displayDocument: boolean
  isCustom: boolean
  description: string | null
  requiresAuthentication: boolean
  dueDate: string
  availablePayments: any
}

interface Validator {
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
  totalizers: Array<{ id: string; name: string; value: number }>
  shippingData: {
    address: CheckoutAddress
    logisticsInfo: LogisticsInfo[]
    selectedAddresses: CheckoutAddress[]
    availableAddresses: CheckoutAddress[]
    pickupPoints: Array<{
      friendlyName: string
      address: CheckoutAddress
      additionalInfo: string
      id: string
      businessHours: Array<{
        DayOfWeek: number
        OpeningTime: string
        ClosingTime: string
      }>
    }>
  }
  clientProfileData: any | null
  paymentData: PaymentData
  marketingData: OrderFormMarketingData | null
  sellers: Array<{
    id: string
    name: string
    logo: string
  }>
  clientPreferencesData: OrderFormClientPreferencesData
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

interface OrderFormClientPreferencesData {
  locale: string
  optinNewsLetter: boolean | null
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
  country?: string
  items: PayloadItem[]
  postalCode?: string
  isCheckedIn?: boolean
  priceTables?: string[]
  marketingData?: Record<string, string>
  geoCoordinates?: [string | number, string | number]
  shippingData?: any
}

interface SLAItem {
  id: string
  deliveryChannel: string
  name: string
  deliveryIds: Array<{
    courierId: string
    warehouseId: string
    dockId: string
    courierName: string
    quantity: number
  }>
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

interface LogisticsInfo {
  itemIndex: number
  selectedSla: string | null
  selectedDeliveryChannel: string | null
  addressId: string
  slas: SLAItem[]
  shipsTo: string[]
  itemId: string
  deliveryChannels: Array<{ id: string }>
}

interface SimulationOrderForm extends OrderForm {
  logisticsInfo?: LogisticsInfo[]
}

interface SLA {
  id: string
  deliveryChannel: string
  name: string
  deliveryIds: Array<{
    courierId: string
    warehouseId: string
    dockId: string
    courierName: string
    quantity: number
  }>
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

interface ItemWithSimulationInput {
  itemId: string
  sellers: Array<{
    sellerId: string
  }>
}

interface Installment {
  count: number
  hasInterestRate: boolean
  interestRate: number
  value: number
  total: number
  sellerMerchantInstallments: Array<{
    id: string
    count: number
    hasInterestRate: boolean
    interestRate: number
    value: number
    total: number
  }>
}

interface PaymentData {
  installmentOptions: InstallmentOption[]
  paymentSystems: PaymentSystem[]
  payments: any[]
  giftCards: any[]
  giftCardMessages: any[]
  availableAccounts: any[]
  availableTokens: any[]
  availableAssociations: any
}

interface RatesAndBenefitsData {
  rateAndBenefitsIdentifiers: Array<{
    id: string
    name: string
    featured: boolean
    description: string
    additionalInfo?: {
      key: string
      value: string
    }
  }>
  teaser: Array<{
    featured: boolean
    id: string
    name: string
    generalValues: {
      key: string
      value: string
    }
    conditions: {
      parameters: Array<{
        name: string
        value: string
      }>
      minimumQuantity: number
    }
    effects: {
      parameters: Array<{
        name: string
        value: string
      }>
    }
    teaserType: string
  }>
}
