import { WithCurrentProfile } from './withCurrentProfile'
import { WithSegment } from './withSegment'
import { WithOrderFormId } from './withOrderFormId'
import { ToVtexAssets } from './toVtexAssets'

export const schemaDirectives = {
  toVtexAssets: ToVtexAssets,
  withCurrentProfile: WithCurrentProfile,
  withSegment: WithSegment,
  withOrderFormId: WithOrderFormId,
}
