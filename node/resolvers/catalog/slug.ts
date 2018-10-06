import slugify from 'slugify'

export function Slugify(str) {
  return slugify(str, { lower: true, remove: /[*+~.()'"!:@]/g })
}
