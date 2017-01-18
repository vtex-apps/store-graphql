import bluebird from 'bluebird'
import redis from 'redis'

bluebird.promisifyAll(redis.RedisClient.prototype)

const client = redis.createClient({
  host: '172.16.16.141',
  port: 6379,
})

const DEFAULT_TTL = 600

const composeKey = (ctx, key) => {
  return key ? `render::${ctx}:${key}` : `render::${ctx}`
}

const get = async (ctx, key) => {
  const value = await client.getAsync(composeKey(ctx, key))
  return (value !== null) ? JSON.parse(value) : null
}

const set = (ctx, key, value, ttl = DEFAULT_TTL) => client.setexAsync(composeKey(ctx, key), ttl, JSON.stringify(value))

const wrapper = (value) => ({ content: value })

const getOrSet = async (ctx, key, func, ttl = DEFAULT_TTL) => {
  let value = await get(ctx, key)
  if (value != null) {
    return value.content
  }
  value = await func()
  await set(ctx, key, wrapper(value), ttl)
  return value
}

export default {
  getOrSet,
}
