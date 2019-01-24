import { ID } from '../primitive'
import { SessionProfile } from '../profile/profile'

 /* Informations about user Session */
export interface Session {
  /* Session ID */
  id?: ID
  /* Id of admin logged in session */
  adminUserId?: string
  /* Email of Admin logged in session */
  adminUserEmail?: string
  /* Check if this admin can impersonate a user */
  impersonable?: boolean
  /* Object with information about impersonate user */
  impersonate?: ImpersonatedUser
  /* Profile information of session user */
  profile?: SessionProfile
}

/* Basic information that is displayed when is a impersonated session */
export interface ImpersonatedUser {
  /* Profile information of impersonated user */
  profile?: SessionProfile
}
