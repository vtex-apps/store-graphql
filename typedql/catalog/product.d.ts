import { ID, Int, Float } from '../primitive'
import { Benefit } from './benefits'
import { InstallmentsCriteria } from './installments'

export interface Product {
  brand?: string
  cacheId?: ID
  categoryId?: ID
  categories?: string[]
  categoriesIds?: string[]
  clusterHighlights?: ClusterHighlight[]
  productClusters?: ProductClusters[]
  description?: string
  items?: SKU[]
  link?: string
  linkText?: string
  productId?: ID
  productName?: string
  properties?: Property[]
  propertyGroups?: PropertyGroup[]
  productReference?: string
  titleTag?: string
  metaTagDescription?: string
  recommendations?: Recommendation
  jsonSpecifications?: string
  benefits?: Benefit[]
}

export interface OnlyProduct {
  brand?: string
  categoryId?: ID
  categories?: string[]
  categoriesIds?: string[]
  clusterHighlights?: ClusterHighlight[]
  productClusters?: ProductClusters[]
  description?: string
  link?: string
  linkText?: string
  productId?: ID
  productName?: string
  properties?: Property[]
  propertyGroups?: PropertyGroup[]
  productReference?: string
  recommendations?: Recommendation
  jsonSpecifications?: string
}

export interface ProductClusters {
  id?: ID
  name?: string
}

export interface ClusterHighlight {
  id?: ID
  name?: string
}

export interface Seller {
  sellerId?: ID
  sellerName?: string
  addToCartLink?: string
  sellerDefault?: boolean
  commertialOffer?: Offer
}

export interface Recommendation {
  buy?: Product[]
  view?: Product[]
  similars?: Product[]
}

export interface SKU {
  itemId?: ID
  name?: string
  nameComplete?: string
  complementName?: string
  ean?: string
  referenceId?: Reference[]
  measurementUnit?: string
  unitMultiplier?: Float
  kitItems?: KitItem[]
  images?(quantity: Int | null): Image[] | null
  sellers?: Seller[]
  variations?: Property[]
  attachments?: Attachment[]
  calculatedAttachments?: string
}

export interface KitItem {
  itemId?: ID
  amount?: Int
  product?: OnlyProduct
  sku?: SKU
}

export interface Attachment {
  id?: ID
  name?: string
  required?: boolean
  domainValues?: DomainValues[]
}

export interface DomainValues {
  FieldName?: string
  MaxCaracters?: string
  DomainValues?: string
}

export interface Offer {
  Installments?(criteria: InstallmentsCriteria | null, rates: boolean | null): Installment[] | null
  Price?: Float
  ListPrice?: Float
  PriceWithoutDiscount?: Float
  RewardValue?: Float
  PriceValidUntil?: string
  AvailableQuantity?: Float
  Tax?: Float
  CacheVersionUsedToCallCheckout?: string
  DeliverySlaSamples?: DeliverySlaSamples[]
}

export interface DeliverySlaSamples {
  DeliverySlaPerTypes?: DeliverySlaPerTypes[]
  Region?: Region
}

export interface DeliverySlaPerTypes {
  TypeName?: string
  Price?: Float
  EstimatedTimeSpanToDelivery?: string
}

export interface Region {
  IsPersisted?: boolean
  IsRemoved?: boolean
  Id?: ID
  Name?: string
  CountryCode?: string
  ZipCode?: string
  CultureInfoName?: string
}

export interface Image {
  cacheId?: ID
  imageId?: ID
  imageLabel?: string
  imageTag?: string
  imageUrl?: string
  imageText?: string
}

export interface Property {
  name?: string
  values?: string[]
}

export interface PropertyGroup {
  name?: string
  properties?: string[]
}

export interface Installment {
  Value?: Float
  InterestRate?: Float
  TotalValuePlusInterestRate?: Float
  NumberOfInstallments?: Int
  PaymentSystemName?: string
  PaymentSystemGroupName?: string
  Name?: string
}

export interface Reference {
  Key?: string
  Value?: string
}
