import http from 'axios'
import {prop} from 'ramda'

let vtexToken

export default ({account, workspace}, vtexId) => {
  return vtexToken
    ? Promise.resolve(vtexToken)
    : http.request(
      {
        url: `http://router.aws-us-east-1.vtex.io/${account}/${workspace}/tokens/legacy`,
        method: 'GET',
        headers: {Authorization: vtexId},
      })
      .then(({data}) => vtexToken = data)
}
