interface SearchArgs {
  query: string | null
  category: string | null
  specificationFilters: string[] | null
  priceRange: string | null
  collection: string | null
  salesChannel: string | null
  orderBy: string | null
  from: number | null
  to: number | null
  map: string | null
  hideUnavailableItems: boolean | null
}

interface Metadata {
  metaTagDescription?: string
  titleTag?: string
}

interface Brand {
  id: string
  name: string
  isActive: boolean
  title?: string
  metaTagDescription?: string
}

interface Category {
  id: number
  name: string
  url: string
  hasChildren: boolean
  children: Category[]
  MetaTagDescription: string
  Title: string
}

interface FacetsArgs {
  facets: string // deprecated!
  query: string
  map: string
  hideUnavailableItems: boolean
}

interface Product {
  productId: string
  productName: string
  brand: string
  brandId: number
  linkText: string
  productReference: string
  categoryId: string
  productTitle: string
  metaTagDescription: string
  clusterHighlights: Record<string, string>
  productClusters: Record<string, string>
  searchableClusters: Record<string, string>
  categories: string[]
  categoriesIds: string[]
  link: string
  description: string
  items: Item[]
  itemMetadata: {
    items: CatalogMetadataItem[]
  }
  titleTag: string
  jsonSpecifications: string
}

interface Item {
  itemId: string
  name: string
  nameComplete: string
  complementName: string
  ean: string
  referenceId: Array<{ Key: string; Value: string }>
  measurementUnit: string
  unitMultiplier: number
  modalType: any | null
  images: Array<{
    imageId: string
    imageLabel: string | null
    imageTag: string
    imageUrl: string
    imageText: string
  }>
  videos: Array<{
    videoUrl: string
  }>
  variations: string[]
  sellers: Seller[]
}

interface Installment {
  Value: number
  InterestRate: number
  TotalValuePlusInterestRate: number
  NumberOfInstallments: number
  PaymentSystemName: string
  PaymentSystemGroupName: string
  Name: string
}

// TODO: It should be Commercial, but there are so many places with this typo that I prefer to keep
interface CommertialOffer {
  DeliverySlaSamplesPerRegion: Record<
    string,
    { DeliverySlaPerTypes: any[]; Region: any | null }
  >
  Installments: Installment[]
  DiscountHighLight: any[]
  GiftSkuIds: string[]
  Teasers: any[]
  BuyTogether: any[]
  ItemMetadataAttachment: any[]
  Price: number
  PriceWithPriceTags: number
  ListPrice: number
  PriceWithoutDiscount: number
  RewardValue: number
  PriceValidUntil: string
  AvailableQuantity: number
  Tax: number
  DeliverySlaSamples: Array<{
    DeliverySlaPerTypes: any[]
    Region: any | null
  }>
  GetInfoErrorMessage: any | null
  CacheVersionUsedToCallCheckout: string
}

interface Seller {
  sellerId: string
  sellerName: string
  addToCartLink: string
  sellerDefault: boolean
  commertialOffer: CommertialOffer
}

interface SalesChannelAvailable {
  Id: number
  Name: string
  IsActive: boolean
  ProductClusterId: string | null
  CountryCode: string
  CultureInfo: string
  TimeZone: string
  CurrencyCode: string
  CurrencySymbol: string
  CurrencyLocale: number
  CurrencyFormatInfo: unknown
  Position: number
  ConditionRule: string | null
  CurrencyDecimalDigits: null | number
}
