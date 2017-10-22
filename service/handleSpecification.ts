export default async (body) => {
	const root = body.root
	const specs = (root.allSpecifications || []).map(spec => ({
		name: spec,
		values: root[spec]
	}))
	return {data: specs}
}
