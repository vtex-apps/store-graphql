import {compose, last, split} from 'ramda'

const getLastPathSegment = compose(last, split('/'))

export default {
  Category: {
    href: ({url}) => url,
    slug: ({url}) => url ? getLastPathSegment(url) : null,
  },
}
