interface Session {
  id: string
  namespaces?: {
    profile: SessionProfile
    impersonate: SessionImpersonate
    authentication: SessionAuthentication
    public: SessionPublic
  }
}

interface SessionProfile {
  id?: ObjValue
  email?: ObjValue
  firstName?: ObjValue
  lastName?: ObjValue
  phone?: ObjValue
  isAuthenticated?: ObjValue
  priceTables?: ObjValue
}

interface SessionImpersonate {
  storeUserEmail?: ObjValue
  storeUserId?: ObjValue
}

interface SessionAuthentication {
  [key: string]: string
}

interface ObjValue {
  value: string
}

interface SessionPublic {
  orderFormId?: ObjValue
  utm_source?: ObjValue
  utm_medium?: ObjValue
  utm_campaign?: ObjValue
  utm_term?: ObjValue
  utm_content?: ObjValue
  utmi_cp?: ObjValue
  utmi_pc?: ObjValue
  utmi_p?: ObjValue
}
