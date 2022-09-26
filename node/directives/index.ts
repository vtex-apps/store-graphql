import { WithCurrentProfile } from './withCurrentProfile'
import { WithSegment } from './withSegment'
import { WithOrderFormId } from './withOrderFormId'
import { ToVtexAssets } from './toVtexAssets'
import { AuthorizationMetrics } from './authorizationMetrics'
import { WithSettings } from './withSettings'

export const schemaDirectives = {
  toVtexAssets: ToVtexAssets,
  withCurrentProfile: WithCurrentProfile,
  withSegment: WithSegment,
  withOrderFormId: WithOrderFormId,
  withAuthMetrics: AuthorizationMetrics,
  withSettings: WithSettings,
}
