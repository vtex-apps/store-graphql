import {applyMiddlewares} from './middlewares'

import './axiosConfig'
import catalogResolvers from './resolvers/catalog'
import checkoutResolvers from './resolvers/checkout'
import profileResolvers from  './resolvers/profile'

// tslint:disable-next-line:no-var-requires
Promise = require('bluebird')
Promise.config({longStackTraces: true})

export default {
  routes: applyMiddlewares({...catalogResolvers, ...checkoutResolvers, ...profileResolvers}),
}
