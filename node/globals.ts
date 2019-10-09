import {
  IOContext,
  MetricsAccumulator,
  SegmentData,
  ServiceContext,
} from '@vtex/api'

import { Clients } from './clients'
import { IdentityDataSource } from './dataSources/identity'

if (!global.metrics) {
  console.error('No global.metrics at require time')
  global.metrics = new MetricsAccumulator()
}

declare global {
  type Context = ServiceContext<Clients, void, CustomContext>

  interface CustomContext {
    cookie: string
    dataSources: StoreGraphQLDataSources
    originalPath: string
    vtex: CustomIOContext
  }

  interface CustomIOContext extends IOContext {
    currentProfile: CurrentProfile
    segment?: SegmentData
    orderFormId?: string
  }

  interface StoreGraphQLDataSources {
    identity: IdentityDataSource
  }

  interface UserAddress {
    id: string
    addressName: string
  }

  interface UserProfile {
    id: string
  }

  interface CurrentProfile {
    email: string
    userId: string
  }

  interface Item {
    thumb: string
    name: string
    href: string
    criteria: string
    slug: string
  }

  interface Address {
    id: string
    userId: string
    receiverName?: string
    complement?: string
    neighborhood?: string
    country?: string
    state?: string
    number?: string
    street?: string
    postalCode?: string
    city?: string
    reference?: string
    addressName?: string
    addressType?: string
    geoCoordinates?: string
  }

  interface Profile {
    firstName?: string
    lastName?: string
    profilePicture?: string
    email: string
    document?: string
    userId: string
    birthDate?: string
    gender?: string
    homePhone?: string
    businessPhone?: string
    isCorporate?: boolean
    corporateName?: string
    corporateDocument?: string
    stateRegistration?: string
    addresses?: Address[]
    tradeName?: string
    payments?: PaymentProfile[]
    customFields?: ProfileCustomField[]
  }

  interface PersonalPreferences {
    isNewsletterOptIn?: 'True' | 'False'
  }

  interface ProfileCustomField {
    key: string
    value: string
  }

  interface PaymentProfile {
    id: string
    paymentSystem: string
    paymentSystemName: string
    carNumber: string
    address: Address
  }

  interface DocumentResponse {
    Id: string
    Href: string
    DocumentId: string
  }

  interface DocumentArgs {
    acronym: string
    fields: string[]
    id: string
  }

  interface DocumentSchemaArgs {
    dataEntity: string
    schema: string
  }

  interface DocumentsArgs {
    acronym: string
    fields: string[]
    page: number
    pageSize: number
    where: string
    schema?: string
  }

  interface CreateDocumentArgs {
    acronym: string
    document: { fields: KeyValue[] }
    schema?: string
  }

  interface UpdateDocumentArgs {
    acronym: string
    document: { fields: KeyValue[] }
    schema?: string
  }

  interface DeleteDocumentArgs {
    acronym: string
    documentId: string
  }

  interface KeyValue {
    key: string
    value: string
  }

  interface IncomingFile {
    filename: string
    mimetype: string
    encoding: string
  }

  interface SKU {
    itemId: string
    name: string
    nameComplete: string
    productName: string
    productDescription: string
    brandName: string
    variations: [Property]
    skuSpecifications: [SkuSpecification]
    productSpecifications: [ProductSpecification]
  }

  interface Property {
    name: string
    values: [string]
  }

  interface SkuSpecification {
    fieldName: Promise<TranslatableMessage>
    fieldValues: [Promise<TranslatableMessage>]
  }

  interface ProductSpecification {
    fieldName: Promise<TranslatableMessage>
    fieldValues: [Promise<TranslatableMessage>]
  }

  interface TranslatableMessage {
    content: string
    from: string
    id: string
  }

  interface Reference {
    Key: string
    Value: string
  }
}
