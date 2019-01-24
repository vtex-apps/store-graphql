import { Address } from "../profile/profile";

export interface PaymentSession {
  id: string
  name: string
  expiresAt: string
}

export interface PaymentToken {
  token: string
  bin: string
  lastDigits: string
  expiresAt: string
  paymentSystem: string
  paymentSystemName: string
}

/* Payment data used by profile resolvers */
export interface PaymentProfile {
  /* Id representing this payment form */
  id: string
  /* Id for the payment system related to this payment form */
  paymentSystem: string
  /* The name of the payment system */
  paymentSystemName: string
  /* Last digits of the card this type represents (in the form ************9999) */
  cardNumber: string
  /* Billing address for this payment form (type definition in the Profile file) */
  address: Address
}

/**
 * @graphql input
 */
export interface PaymentInput {
  paymentSystem: string
  cardHolder: string
  cardNumber: string
  expiryDate: string
  csc: string
  document: string
  documentType: string
  partnerId: string
  address: PaymentAddress
}

/**
 * @graphql input
 */
export interface PaymentAddress {
  postalCode: string
  street: string
  neighborhood: string
  city: string
  receiverName: string
  state: string
  country: string
  number: string
  complement: string
}
