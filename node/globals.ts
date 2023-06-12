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
    ownerId?: string
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
    name?: string
    addressName?: string
    addressType?: string
    city?: string
    complement?: string
    country?: string
    geoCoordinates?: string[]
    id: string
    neighborhood?: string
    number?: string
    postalCode?: string
    receiverName?: string
    reference?: string
    state?: string
    street?: string
    userId: string
  }

  interface AddressV2 {
    id: string
    document: {
      administrativeAreaLevel1?: string
      addressName?: string
      addressType?: string
      complement?: string
      countryCode?: string
      extend?: string
      geoCoordinates?: string[]
      locality?: string
      localityAreaLevel1?: string
      name?: string
      nearly?: string
      postalCode?: string
      profileId?: string
      route?: string
      streetNumber?: string
      receiverName?: string
      neighborhood?: string
    }
    meta?: {
      version: string
      author: string
      creationDate: string
      lastUpdateDate: string
    }
  }

  interface ProfileV2 {
    id: string
    document: Profile
    meta: {
      version: string
      author: string
      creationDate: string
      lastUpdateDate: string
    }
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
    id: string
    pii: boolean
    isNewsletterOptIn?: boolean
  }

  interface PurchaseInfo {
    id: string
    document: {
      clientPreferences: {
        userId: string
        localeDefault: string
        isNewsletterOptIn?: boolean
      }
    }
  }

  interface Account {
    HostName: string
    MainAccountName: string
    IsPersisted: boolean
    IsRemoved: boolean
    Id: string
    Cnpj: string
    CompanyName: string
    TradingName: string
    AccountName: string
    DefaultUrl: string
    Address: string
    Number: string
    Complement: string
    District: string
    City: string
    State: string
    PostalCode: string
    Country: string
    Telephone: string
    IsActive: boolean
    Sponsor: string
    Logo: string
    AppId: string
    IsOperating: boolean
    LV: string
    Sigla: string
    AppKeys: string
    CreationDate: string
    OperationDate: string
    InactivationDate: string
    ParentAccountId: string
    ParentAccountName: string
    ChildAccounts: string[]
    Platform: string
    Licenses: number[]
    Workspace: string
    Stores: string[]
    Privacy: {
      PII: string
    } | null
    Infra: {
      Provider: string
      Region: string
    } | null
    PIIEnabled: boolean
  }

  interface PersonalPreferences {
    [key: string]: string | number | boolean | undefined
    firstName?: string
    homePhone?: string
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

  interface DocumentResponseV2 {
    Id: string
    Href: string
    DocumentId: string
  }

  interface DocumentArgs {
    acronym: string
    fields: string[]
    id: string
    account?: string
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
    sort: string
    schema?: string
    account?: string
  }

  interface CreateDocumentArgs {
    acronym: string
    document: { fields: KeyValue[] }
    account?: string
    schema?: string
  }

  interface CreateDocumentV2Args {
    dataEntity: string
    document: { document: any }
    account?: string
    schema?: string
  }

  interface UpdateDocumentArgs {
    acronym: string
    document: { fields: KeyValue[] }
    account?: string
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
    fieldName: string
    fieldValues: string[]
  }

  interface ProductSpecification {
    fieldName: string
    fieldValues: string[]
  }

  interface Reference {
    Key: string
    Value: string
  }

  interface PIIRequest {
    useCase: string
    onBehalfOf: string
  }
}
