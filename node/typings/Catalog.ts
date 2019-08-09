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
  facets: string //deprecated!
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
}

interface Item {
  itemId: string
  name: string
  nameComplete: string
  complementName: string
  ean: string
  referenceId: { Key: string; Value: string }[]
  measurementUnit: string
  unitMultiplier: number
  modalType: any | null
  images: {
    imageId: string
    imageLabel: string | null
    imageTag: string
    imageUrl: string
    imageText: string
  }[]
  videos: {
    videoUri: string
  }[]
  variations: string[]
  sellers: Seller[]
}

interface Seller {
  sellerId: string
  sellerName: string
  addToCartLink: string
  sellerDefault: boolean
  commertialOffer: {
    DeliverySlaSamplesPerRegion: Record<
      string,
      { DeliverySlaPerTypes: any[]; Region: any | null }
    >
    Installments: {
      Value: number
      InterestRate: number
      TotalValuePlusInterestRate: number
      NumberOfInstallments: number
      PaymentSystemName: string
      PaymentSystemGroupName: string
      Name: string
    }[]
    DiscountHighLight: any[]
    GiftSkuIds: string[]
    Teasers: any[]
    BuyTogether: any[]
    ItemMetadataAttachment: any[]
    Price: number
    ListPrice: number
    PriceWithoutDiscount: number
    RewardValue: number
    PriceValidUntil: string
    AvailableQuantity: number
    Tax: number
    DeliverySlaSamples: {
      DeliverySlaPerTypes: any[]
      Region: any | null
    }[]
    GetInfoErrorMessage: any | null
    CacheVersionUsedToCallCheckout: string
  }
}
