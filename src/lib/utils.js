const createUtils = (model) => {
	const getAssignableObject = (path, index) => path.slice(0, index).reduce((agg, p) => agg[p], model)

	const ensurePath = (path) => {
		if (path.length < 2) {
			return
		}

		if (path.length > 2) {
			ensurePath(path.slice(0, path.length - 1))
		}

		const lastObjectKey = path[path.length - 2]

		const assignable = getAssignableObject(path, path.length - 2)
		if (assignable[lastObjectKey]) {
			return
		}
		const lastType = typeof path[path.length - 1]
		assignable[lastObjectKey] = lastType === 'number' ? [] : {}
	}

	const applySetter = (object, key, value) => {
		if (typeof value === 'undefined') {
			delete object[key]
		} else {
			object[key] = value
		}
	}

	return {
		ensurePath,
		getAssignableObject,
		applySetter
	}
}

module.exports = {createUtils}
