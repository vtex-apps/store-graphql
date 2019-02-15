import { Int, ID } from './primitive'
import { Product } from './catalog/product'
import { Facets } from './catalog/facets'
import { Suggestions } from './catalog/suggestions'
import { Brand } from './catalog/brand'
import { Category } from './catalog/category'
import { SearchContext } from './catalog/searchContext'
import { Search } from './catalog/search'
import { LoginOptions } from './auth/loginOptions'
import { OrderForm, OrderFormItemInput, OrderFormProfileInput, OrderFormAddressInput, OrderFormPaymentInput, OrderFormPaymentTokenInput } from './checkout/orderForm'
import { Profile, ProfileInput, ProfileCustomFieldInput, AddressInput } from './profile/profile'
import { ShippingData, ShippingItem } from './logistics/logistics'
import { Order } from './checkout/order'
import { Benefit } from './catalog/benefits'
import { Document, DocumentInput, DocumentResponse, AttachmentResponse } from './masterdata/document'
import { LogisticsData } from './logistics/logisticsData'
import { Session } from './session/session'
import { SubscriptionsStatusCount, SubscriptionsOrdersStatusCount, SubscriptionsOrder } from './subscriptions/subscriptions'
import { List, ListInput } from './whishlist/list'
import { PaymentSession, PaymentInput, PaymentToken } from './payment/payment'
import { PlaceholderInput } from './payment/placeholderInput'

type IOUpload = any

export interface Query {
  /** @graphql Description
   * Get a specified product
   *
   * @graphql Directives
   * @cacheControl(scope: SEGMENT, maxAge: SHORT)
   */
  product(slug?: string): Product | null

  /** @graphql Description
   * Product search filtered and ordered
   *
   * @graphql Directives
   * @cacheControl(scope: SEGMENT, maxAge: SHORT)
   */
  products(
    /* @graphql Description Terms that is used in search e.g.: eletronics/samsung */
    query?: string,
    /* @graphql Description Defines terms types: Brand, Category, Department e.g.: c,b */
    map?: string,
    /* @graphql Description Filter by category. {a}/{b} - {a} and {b} are categoryIds */
    category?: string,
    /* @graphql Description Array of product specification. specificationFilter_{a}:{b} - {a} is the specificationId, {b} = specification value */
    specificationFilters?: (string | null)[],
    /* @graphql Description Filter by price range. e.g.: {a} TO {b} - {a} is the minimum price "from" and {b} is the highest price "to" */
    priceRange?: string,
    /* @graphql Description Filter by collection. where collection also know as productClusterId */
    collection?: string,
    /* @graphql Description Filter by availability at a specific sales channel. e.g.: salesChannel:4 if want filter by available products for the sales channel 4 */
    salesChannel?: string,
    /* @graphql Description Order by a criteria. OrderByPriceDESC/OrderByPriceASC, OrderByTopSaleDESC, OrderByReviewRateDESC, OrderByNameASC/OrderByNameDESC, OrderByReleaseDateDESC, OrderByBestDiscountDESC */
    orderBy?: string,
    /* @graphql Description Pagination item start */
    from?: Int,
    /* Pagination item end */
    to?: Int
  ): Product[] | null

  /**
   * Get facets category
   *
   * @graphql Directives
   * @cacheControl(scope: SEGMENT)
   */
  facets(
    /* Categories separated by / followed by map. e.g.:  /eletronics/tvs?map=c,c */
    facets: string | null
  ): Facets | null

  /**
   * Search for products. e.g.: search(query: 'eletronics', rest: 'lg', map: 'c,b')
   *
   * @graphql Directives
   * @cacheControl(scope: SEGMENT, maxAge: SHORT)
   */
  search(
    /* Terms that is used in search e.g.: eletronics/samsung */
    query?: string,
    /* Defines terms types: Brand, Category, Department e.g.: c,b */
    map?: string,
    /* Rest terms that is used in search e.g.: samsung,Android7 */
    rest?: string,
    /* Filter by category. {a}/{b} - {a} and {b} are categoryIds */
    category?: string,
    /* Array of product specification. specificationFilter_{a}:{b} - {a} is the specificationId, {b} = specification value */
    specificationFilters?: string[],
    /* Filter by price range. e.g.: {a} TO {b} - {a} is the minimum price "from" and {b} is the highest price "to" */
    priceRange?: string,
    /* Filter by collection. where collection also know as productClusterId */
    collection?: string,
    /* Filter by availability at a specific sales channel. e.g.: salesChannel:4 if want filter by available products for the sales channel 4 */
    salesChannel?: string,
    /* Order by a criteria. OrderByPriceDESC/OrderByPriceASC, OrderByTopSaleDESC, OrderByReviewRateDESC, OrderByNameASC/OrderByNameDESC, OrderByReleaseDateDESC, OrderByBestDiscountDESC */
    orderBy?: string,
    /* Pagination item start */
    from?: Int,
    /* Pagination item end */
    to?: Int
  ): Search | null

  /**
   * Get category details
   *
   * @graphql Directives
   * @cacheControl(scope: PUBLIC, maxAge: MEDIUM)
   */
  category(
    /* Category id */
    id?: Int
  ): Category | null

  /**
   * Get categories tree
   *
   * @graphql Directives
   * @cacheControl(scope: PUBLIC, maxAge: MEDIUM)
   */
  categories(
    /* Category tree level. Default: 3 */
    treeLevel?: Int
  ): Category[] | null

  /**
   * Get brand details
   *
   * @graphql Directives
   * @cacheControl(scope: PUBLIC, maxAge: MEDIUM)
   */
  brand(id?: Int): Brand | null

  /**
   * Get a list of brands
   *
   * @graphql Directive
   * @cacheControl(scope: PUBLIC, maxAge: MEDIUM)
   */
  brands(): Brand[] | null

  /* OrderForm simulation */
  shipping(
    /* List of SKU products */
    items?: ShippingItem[],
    /* Postal code to freight calculator */
    postalCode?: string,
    /* Country of postal code */
    country?: string
  ): ShippingData | null

  /* Get checkout cart details */
  /**
   * @graphql Directive
   * @cacheControl(scope: PRIVATE)
   */
  orderForm(): OrderForm | null

  /**
   * Get user orders details
   *
   * @graphql Directive
   * @cacheControl(scope: PRIVATE)
   */
  orders(): Order[] | null

  /**
   * Get user profile details
   *
   * @graphql Directive
   * @cacheControl(scope: PRIVATE)
   */
  profile(
    /* Comma separated fields */
    customFields?: string
  ): Profile | null

  /* Get auto complete suggestions in search */
  autocomplete(
    /* Number of items that is returned */
    maxRows?: Int,
    /* Terms that is used in search e.g.: iphone */
    searchTerm?: string
  ): Suggestions | null

  /* Search documents */
  documents(
    /* Schema name. e.g.: CL, AD */
    acronym: string | null,
    /* Fields that will be returned by document. e.g.: _fields=email,firstName,document */
    fields: string[] | null,
    /* Pagination. Default: 1 */
    page: Int | null,
    /* Items returned in the page. Default: 15 */
    pageSize: Int | null,
    /* Filters the results. eg.: _where=email=my@email.com */
    where: string
  ): Document[] | null

  /* Get document */
  document(
    /* Schema name. e.g.: CL, AD */
    acronym: string,
    /* Fields that will be returned in document. e.g.: _fields=email,firstName,document */
    fields: string[],
    /* Document id */
    id: string
  ): Document | null

  /* Get the benefits associated with a list of products */
  benefits(
    /* List of Products */
    items: ShippingItem[]
  ): Benefit[] | null

  /* Get the options available to authenticate users */
  loginOptions: LoginOptions | null

  /* Get the IDs for the provided search context slugs */
  searchContextFromParams(
    brand?: string,
    department?: string,
    category?: string,
    subcategory?: string
  ): SearchContext | null

  /* Get logistics information about the store */
  logistics(): LogisticsData | null

  /**
   * Get profile information to session users
   *
   * @graphql Directive
   * @cacheControl(scope: PRIVATE)
   */
  getSession(): Session | null

  /**
   * Get count of subscriptions by status
   *
   * @graphql Directive
   * @cacheControl(scope: PRIVATE)
   */
  subscriptionsCountByStatus(
    /* Initial date. e.g.: 2018-10-13T00:00:00 */
    initialDate: string,
    /* End date. e.g.: 2018-10-13T00:00:00 */
    endDate: string
  ): SubscriptionsStatusCount | null

  /**
   * Get count of subscriptions by status
   *
   * @graphql Directive
   * @cacheControl(scope: PRIVATE)
   */
  subscriptionsOrdersCountByStatus(
    /* Initial date. e.g.: 2018-10-13T00:00:00 */
    initialDate: string,
    /* End date. e.g.: 2018-10-13T00:00:00 */
    endDate: string
  ): SubscriptionsOrdersStatusCount | null

  /* Get a list of SubscriptionsOrders */
  listSubscriptionsOrdersByStatus(
    /* Initial date. e.g.: 2018-10-13T00:00:00 */
    initialDate: string,
    /* End date. e.g.: 2018-10-13T00:00:00 */
    endDate: string,
    /* Subscription Order status, it also can be: ALL, ERROR, SUCCESSFUL. */
    status: string
  ): SubscriptionsOrder[] | null

  /* Get the Wish List informations by the received id */
  list(
    /* The list document id */
    id: ID | null
  ): List | null

  /* Get all lists from the received owner */
  listsByOwner(
    /* The list's owner id */
    owner: ID | null,
    /* The page that will be fetched */
    page: Int | null,
    /* The page size */
    pageSize: Int | null
  ) : List[] | null
}

export interface Mutation {
  /* Cart */
  addItem(orderFormId: string | null, items: OrderFormItemInput[] | null): OrderForm | null
  cancelOrder(orderFormId: string | null, reason: string | null): boolean | null
  updateItems(orderFormId: string | null, items: OrderFormItemInput[] | null): OrderForm | null

  /* Profile */
  updateProfile(fields: ProfileInput, customFields: ProfileCustomFieldInput[] | null): Profile | null
  updateAddress(id: string | null, fields: AddressInput | null): Profile | null
  createAddress(fields: AddressInput | null): Profile | null
  deleteAddress(id: string | null): Profile | null

  /* Updates the Profile Picture by erasing the old ones */
  updateProfilePicture(
    /* File being uploaded */
    file: IOUpload,
    /* Attachment's field name (default: profilePicture) */
    field: string | null
  ): Profile | null
  /* Uploads the Profile Picture by appending to the existing ones */
  uploadProfilePicture(
    /* File being uploaded */
    file: IOUpload,
    /* Attachment's field name (default: profilePicture) */
    field: string | null
  ): Profile | null

  /* Order Form */
  updateOrderFormProfile(orderFormId: string | null, fields: OrderFormProfileInput | null): OrderForm | null
  updateOrderFormShipping(orderFormId: string | null, address: OrderFormAddressInput | null): OrderForm | null
  updateOrderFormPayment(orderFormId: string | null,  payments: OrderFormPaymentInput[] | null): OrderForm | null
  updateOrderFormIgnoreProfile(orderFormId: string | null, ignoreProfileData: boolean | null): OrderForm | null
  addOrderFormPaymentToken(orderFormId: string | null, paymentToken: OrderFormPaymentTokenInput | null): OrderForm | null
  setOrderFormCustomData(orderFormId: string | null, appId: string | null, field: string | null, value: string | null): OrderForm | null

  /* Payment */
  createPaymentSession: PaymentSession | null
  createPaymentTokens(sessionId: string | null, payments: PaymentInput[] | null): PaymentToken[] | null
  setPlaceholder(fields: PlaceholderInput | null): boolean | null

  /* Send access key to user email */
  sendEmailVerification(
    /* User email */
    email: string
  ): boolean | null

  /* Access key sign in mode */
  accessKeySignIn(
    /* User email */
    email: string,
    /* Access key that was received */
    code: string
  ): string | null

  /* Classic sign in mode */
  classicSignIn(
    /* User email */
    email: string,
    /* User password */
    password: string
  ): string | null

  /* OAuth to login with Social Account */
  oAuth(
    /* The OAuth Provider, e.g: Google, Facebook */
    provider: string | null,
    /* The URL to be redirected after authentication */
    redirectUrl: string | null
  ): string | null

  /* To recovery password you need to get your email, password and access code */
  recoveryPassword(
    /* User email */
    email: string,
    /* User password */
    newPassword: string,
    /* Access Code */
    code: string
    ): string | null

  /* Change password using email and old password */
  redefinePassword(
    /* User's email */
    email: string,
    /* User's current password */
    currentPassword: string,
    /* User's new password */
    newPassword: string,
    /* Your app's identification to help VTEX ID track requests */
    vtexIdVersion: string | null
  ): string | null

  /* Invalidate VtexIdclientAutCookie */
  logout: boolean | null

  /* Impersonate a customer */
  impersonate(
    /* The email which will be used to impersonate a user */
    email: string,
  ): Session | null

  /* Depersonify a customer */
  depersonify: boolean | null

  /* Document */
  createDocument(acronym: string, document: DocumentInput | null): DocumentResponse | null
  updateDocument(acronym: string, document: DocumentInput | null): DocumentResponse | null
  deleteDocument(acronym: string, documentId: string): DocumentResponse | null
  uploadAttachment(acronym: string, documentId: string, field: string, file: IOUpload): AttachmentResponse | null

  /* Subscriptions */
  subscriptionsOrderRetry(orderGroup: string, instanceId: string, workflowId: string): boolean | null

  /* List */
  createList(list: ListInput | null): List | null
  /* Update the list informations and its items.
  If the item given does not have the itemId, add it as a new item in the list.
  If the item given has got an itemId, but its quantity is 0, remove it from the list.
  Otherwise, update it. */
  updateList(id: ID, list: ListInput | null): List | null
  deleteList(id: ID): List | null
}
