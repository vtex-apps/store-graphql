import * as slugify from 'slugify'

export default {
  Brand: {
    active: ({isActive}) => isActive,
    slug: ({name}) => slugify(name, {lower: true}),
  },
}
