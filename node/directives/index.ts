import { WithCurrentProfile } from './withCurrentProfile'
import { WithSegment } from './withSegment'
import { WithOrderFormId } from './withOrderFormId'
import { ToVtexAssets } from './toVtexAssets'
import { AuthorizationMetrics } from './authorizationMetrics'
import { WithOwnerId } from './withOwnerId'
import { MonitorOrigin } from './monitorOrigin'

export const schemaDirectives = {
  toVtexAssets: ToVtexAssets,
  withCurrentProfile: WithCurrentProfile,
  withSegment: WithSegment,
  withOrderFormId: WithOrderFormId,
  withOwnerId: WithOwnerId,
  withAuthMetrics: AuthorizationMetrics,
  monitorOrigin: MonitorOrigin,
}
