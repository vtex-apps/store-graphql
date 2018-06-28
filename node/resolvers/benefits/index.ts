import httpResolver from "../httpResolver"
import { headers, withAuthToken } from "../headers"
import paths from '../paths'

export const queries = {
  benefits: httpResolver({
    data: ({ items }) => ({
      items
    }),
    merge: (args, data) => data.ratesAndBenefitsData.teaser,
    headers: withAuthToken(headers.json),
    url: paths.benefits,
    method: 'POST'
  })
}