import aws from 'aws-sdk'
import { prop, head, pipe, pluck } from 'ramda'
import cache from './cache'

let lastToken
let nextUpdate = Date.now()

const TTL_S = 5 * 60
const TTL_MS = TTL_S * 1000

const s3 = new aws.S3()

const request = {
  Bucket: 'vtex-id',
  Key: 'tokens/vtexappkey-appvtex.json',
}

const getToken = () =>
  s3.getObject(request)
    .promise()
    .then(prop('Body'))
    .then(body => body.toString())
    .then(JSON.parse)
    .then(pipe(pluck('token'), head))

const getUpdatedToken = async () => {
  try {
    return await cache.getOrSet('global', 'vtex-app-token', getToken, TTL_S)
  } catch (e) {
    /* todo: logar no splunk que não foi possível pegar um token atualizado
     e que estamos usando o último pego com sucesso */
    return lastToken
  }
}

export default async function fetchVtexToken () {
  let token
  const now = Date.now()

  if (nextUpdate > now && lastToken) {
    token = lastToken
  } else {
    nextUpdate = now + TTL_MS
    lastToken = token = await getUpdatedToken()
  }

  return token
}
