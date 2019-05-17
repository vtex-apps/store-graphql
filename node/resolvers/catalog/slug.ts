import slugify from 'slugify'

export function Slugify(str: any) {
  return slugify(str, { lower: true, remove: /[*+~.()'"!:@]/g })
}

// Parameter "S. Coifman" should output "s--coifman"
export function catalogSlugify(str: string) {
  // According to Bacelar, the catalog API uses a legacy method for slugifying strings.
  // It replaces all dots and spaces with - and then removes special characters.
  const slugified = slugify(str, { lower: true, remove: /[*+~()'"!:@]/g })
  // Now replace dots for -
  return slugified.replace(/\./g, '-')
}
