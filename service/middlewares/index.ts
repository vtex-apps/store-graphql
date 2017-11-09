import {compose, map} from 'ramda'
import bodyParserMiddleware from './bodyParserMiddleware'
import errorMiddleware from './errorMiddleware'

export const applyMiddlewares = compose(errorMiddleware, bodyParserMiddleware)
