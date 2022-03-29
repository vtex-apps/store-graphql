import {
  InstanceOptions,
  IOContext,
} from '@vtex/api'

import { ProfileClientV2 } from './profileV2'

export class ProfileClientV2EU extends ProfileClientV2 {
  constructor(context: IOContext, options?: InstanceOptions) {
    super("https://profile-system-eu-west-1.vtex.systems", context, options)
  }
}
