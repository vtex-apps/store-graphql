import './globals'

import { Service } from '@vtex/api'

import { Clients } from './clients'

export default new Service<Clients, void, CustomContext>({
  graphql: {
    resolvers: {
      Query: {
        product: () => ({
          productName: 'something',
        })
      }
    },
  },
})
