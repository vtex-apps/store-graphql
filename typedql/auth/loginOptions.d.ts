export interface LoginOptions {
  /* List of Social providers */
  providers?: Provider[]
  /* Email and Password authentication */
  classicAuthentication?: boolean
  /* Access key through email Code verification */
  accessKeyAuthentication?: boolean
}

/* Describes an OAuth provider type. e.g.: Google, Facebook */
export interface Provider {
  /* Provider Name. e.g.: Google, Facebook */
  providerName?: string,
  /* The provider class. e.g.: google-plus, facebook */
  className?: string
}
