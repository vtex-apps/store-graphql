export default async (body, ctx, req) => {
	const root = body.root
	const type = req.url.includes('/variations') ? 'variations' : 'allSpecifications'
	const specs = (root[type] || []).map(spec => ({
		name: spec,
		values: root[spec]
	}))
	return {data: specs}
}
