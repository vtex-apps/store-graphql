export default (type: string) => async (body, ioContext) => {
  const root = body.root
  const specs = (root[type] || []).map(spec => ({
    name: spec,
    values: root[spec],
  }))
  return {data: specs}
}
