import { prop } from 'ramda'

import { DefaultSalesChannel } from '../../clients/portal'

export default {
  StoreConfigs: {
    defaultCountry: async (_: any, __: any, context: Context) =>
      prop(
        'CountryCode',
        (await context.clients.portal.defaultSalesChannel()) as DefaultSalesChannel
      ),
  },
}
