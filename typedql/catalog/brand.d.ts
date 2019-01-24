import { ID, Int } from "../primitive";

export interface Brand {
  cacheId: ID
  id?: Int
  slug?: string
  name?: string
  titleTag?: string
  metaTagDescription?: string
  active?: boolean
}
