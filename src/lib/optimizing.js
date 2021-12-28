const {createUtils} = require('./utils')

const createLibrary = (res, funcLib, funcLibRaw) => {
	const createInvalidatedSet = (parentKey, parent) => {
		const invalidatedSet = Object.assign(new Set(), {
			subKeys: new Map(),
			parentKey,
			parent,
			tracked: new Map()
		})

		return invalidatedSet
	}

	let tainted = new WeakSet()
	const trackingMap = new WeakMap()
	const trackingWildcards = new WeakMap()
	const invalidatedMap = new WeakMap()
	const invalidatedRoots = createInvalidatedSet(null, null);
	invalidatedMap.set(res, invalidatedRoots);

	const {ensurePath, getAssignableObject, applySetter} = createUtils(res.$model)

	const resetTainted = () => {
		tainted = new WeakSet()
	}

	const untrack = (targetKeySet, targetKey) => {
		const tracked = targetKeySet.tracked
		if (!tracked || !tracked.has(targetKey)) {
			return
		}
		const trackedByKey = tracked.get(targetKey)
		for (let i = 0; i < trackedByKey.length; i += 3) {
			const trackingSource = trackingMap.get(trackedByKey[i])
			trackingSource[trackedByKey[i + 1]].delete(trackedByKey[i + 2])
		}
		tracked.delete(targetKey)
	}

	const invalidate = (targetKeySet, targetKey) => {
		if (targetKeySet.has(targetKey)) {
			return
		}
		targetKeySet.add(targetKey)
		untrack(targetKeySet, targetKey)
		if (targetKeySet.parent) {
			invalidate(targetKeySet.parent, targetKeySet.parentKey)
		}
	}

	const triggerInvalidations = (sourceObj, sourceKey, hard) => {
		tainted.add(sourceObj)
		const track = trackingMap.get(sourceObj)
		if (track && track.hasOwnProperty(sourceKey)) {
			track[sourceKey].forEach((soft, target) => {
				if (!soft || hard) {
					invalidate(target[0], target[1])
				}
			})
		}
		if (trackingWildcards.has(sourceObj)) {
			trackingWildcards.get(sourceObj).forEach((targetInvalidatedKeys) => {
				invalidate(targetInvalidatedKeys, sourceKey)
			})
		}
	}

	const setOnArray = (target, key, val, isNew) => {
		let hard = false
		if (!isNew) {
			if (typeof target[key] === 'object' && target[key] && target[key] !== val) {
				hard = true
			}
			if (
				hard ||
				key >= target.length ||
				target[key] !== val ||
				val && typeof target[key] === 'object' && tainted.has(val)
			) {
				triggerInvalidations(target, key, hard)
			}
		}
		target[key] = val
	}

	let first = true
	const updateModel = (countGetters, builderFunctions, topLevel, builderNames) => {
		for (let i = 0; i < countGetters; i++) {
			if (first || invalidatedRoots.has(i)) {
				const newValue = builderFunctions[i]([invalidatedRoots, i])
				setOnArray(topLevel, i, newValue, first)
				if (!first) {
					invalidatedRoots.delete(i)
				}
				if (builderNames[i]) {
					res[builderNames[i]] = newValue
				}
			}
		}
		first = false
	}

	const setOnObject = (target, key, val, isNew) => {
		let changed = false
		let hard = false
		if (!isNew) {
			if (typeof target[key] === 'object' && target[key] && target[key] !== val) {
				hard = true
			}
			if (
				hard ||
				target[key] !== val ||
				val && typeof val === 'object' && tainted.has(val) ||
				!target.hasOwnProperty(key) && target[key] === undefined
			) {
				changed = true
				triggerInvalidations(target, key, hard)
			}
		}
		target[key] = val
	}

	const deleteOnObject = (target, key, isNew) => {
		let hard = false
		if (!isNew) {
			if (typeof target[key] === 'object' && target[key]) {
				hard = true
			}
			triggerInvalidations(target, key, hard)
			const invalidatedKeys = invalidatedMap.get(target)
			if (invalidatedKeys) {
				invalidatedKeys.subKeys.delete(key)
			}
		}
		delete target[key]
	}

	const truncateArray = (target, newLen) => {
		const invalidatedKeys = invalidatedMap.get(target)
		for (let i = newLen; i < target.length; i++) {
			triggerInvalidations(target, i, true)
			if (invalidatedKeys) {
				invalidatedKeys.subKeys.delete(i)
			}
		}
		target.length = newLen
	}

	const track = (target, sourceObj, sourceKey, soft) => {
		if (!trackingMap.has(sourceObj)) {
			trackingMap.set(sourceObj, {})
		}
		const track = trackingMap.get(sourceObj)
		track[sourceKey] = track[sourceKey] || new Map()
		track[sourceKey].set(target, soft)
		const tracked = target[0].tracked
		let tracking = tracked.get(target[1])
		if (!tracking) {
			tracked.set(target[1], tracking = [])
		}
		tracking.push(sourceObj, sourceKey, target)
	}

	const trackPath = (target, path) => {
		const end = path.length - 2
		let current = path[0]
		for (let i = 0; i <= end; i++) {
			track(target, current, path[i + 1], i !== end)
			current = current[path[i + 1]]
		}
	}

	const initOutput = (tracked, src, func, createDefaultValue, createCacheValue) => {
		const subKeys = tracked[0].subKeys
		if (!subKeys.has(tracked[1])) {
			subKeys.set(tracked[1], new Map())
		}
		const cachePerTargetKey = subKeys.get(tracked[1])
		let cachedByFunc = cachePerTargetKey.get(func)
		if (!cachedByFunc) {
			const resultObj = createDefaultValue()
			const cacheValue = createCacheValue()
			const invalidatedKeys = createInvalidatedSet(tracked[1], tracked[0])
			invalidatedMap.set(resultObj, invalidatedKeys)
			cachedByFunc = [null, resultObj, invalidatedKeys, true, cacheValue]
			cachePerTargetKey.set(func, cachedByFunc)
		} else {
			cachedByFunc[3] = false
		}
		const invalidatedKeys = cachedByFunc[2]
		const prevSrc = cachedByFunc[0]
		if (prevSrc !== src) {
			if (prevSrc) {
				// prev mapped to a different collection
				trackingWildcards.get(prevSrc).delete(invalidatedKeys)
				if (Array.isArray(prevSrc)) {
					prevSrc.forEach((_item, index) => invalidatedKeys.add(index))
				} else {
					Object.keys(prevSrc).forEach((key) => invalidatedKeys.add(key))
				}
				if (Array.isArray(src)) {
					src.forEach((_item, index) => invalidatedKeys.add(index))
				} else {
					Object.keys(src).forEach((key) => invalidatedKeys.add(key))
				}
			}
			if (!trackingWildcards.has(src)) {
				trackingWildcards.set(src, new Set())
			}
			trackingWildcards.get(src).add(invalidatedKeys)
			cachedByFunc[0] = src
		}
		return cachedByFunc
	}

	const emptyObj = () => ({})
	const emptyArr = () => []
	const nullFunc = () => null

	const mapValues = (tracked, identifier, func, src, context) => {
		const storage = initOutput(tracked, src, identifier, emptyObj, nullFunc)
		const out = storage[1]
		const invalidatedKeys = storage[2]
		const isNew = storage[3]
		;(isNew && Object.keys(src) || invalidatedKeys).forEach((key) => {
			if (!src.hasOwnProperty(key)) {
				if (out.hasOwnProperty(key)) {
					deleteOnObject(out, key, isNew)
				}
			} else {
				const result = func([invalidatedKeys, key], key, src[key], context)
				setOnObject(out, key, result, isNew)
			}
		})
		invalidatedKeys.clear()
		return out
	}

	const filterBy = (tracked, identifier, func, src, context) => {
		const storage = initOutput(tracked, src, identifier, emptyObj, nullFunc)
		const out = storage[1]
		const invalidatedKeys = storage[2]
		const isNew = storage[3]
		;(isNew && Object.keys(src) || invalidatedKeys).forEach((key) => {
			if (!src.hasOwnProperty(key)) {
				if (out.hasOwnProperty(key)) {
					deleteOnObject(out, key, isNew)
				}
			} else {
				const result = func([invalidatedKeys, key], key, src[key], context)
				if (result) {
					setOnObject(out, key, src[key], isNew)
				} else if (out.hasOwnProperty(key)) {
					deleteOnObject(out, key, isNew)
				}
			}
		})
		invalidatedKeys.clear()
		return out
	}

	const map = (tracked, identifier, func, src, context) => {
		const storage = initOutput(tracked, src, identifier, emptyArr, nullFunc)
		const out = storage[1]
		const invalidatedKeys = storage[2]
		const isNew = storage[3]
		if (isNew) {
			for (let key = 0; key < src.length; key++) {
				const result = func([invalidatedKeys, key], key, src[key], context)
				setOnArray(out, key, result, isNew)
			}
		} else {
			invalidatedKeys.forEach((key) => {
				if (key < src.length) {
					const result = func([invalidatedKeys, key], key, src[key], context)
					setOnArray(out, key, result, isNew)
				}
			})
			if (out.length > src.length) {
				truncateArray(out, src.length)
			}
		}
		invalidatedKeys.clear()
		return out
	}

	function recursiveSteps(key, tracked) {
		const {dependencyMap, currentStack, invalidatedKeys, out, func, src, context, isNew} = this
		if (currentStack.length > 0) {
			if (!dependencyMap.has(key)) {
				dependencyMap.set(key, [])
			}
			dependencyMap.get(key).push(tracked)
		}
		if (invalidatedKeys.has(key)) {
			invalidatedKeys.delete(key)
			currentStack.push(key)
			if (Array.isArray(out)) {
				if (key >= src.length) {
					setOnArray(out, key, undefined, isNew)
					out.length = src.length
				} else {
					const newVal = func([invalidatedKeys, key], key, src[key], context, this)
					setOnArray(out, key, newVal, isNew)
				}
			} else if (!src.hasOwnProperty(key)) {
				if (out.hasOwnProperty(key)) {
					deleteOnObject(out, key, isNew)
				}
			} else {
				const newVal = func([invalidatedKeys, key], key, src[key], context, this)
				setOnObject(out, key, newVal, isNew)
			}
			invalidatedKeys.delete(key)
			currentStack.pop()
		}
		return out[key]
	}

	const cascadeRecursiveInvalidations = (loop) => {
		const {dependencyMap, invalidatedKeys} = loop
		invalidatedKeys.forEach((key) => {
			if (dependencyMap.has(key)) {
				dependencyMap.get(key).forEach((tracked) => {
					invalidate(tracked[0], tracked[1])
				})
				dependencyMap.delete(key)
			}
		})
	}

	const recursiveCacheFunc = () => ({
		dependencyMap: new Map(),
		currentStack: [],
		recursiveSteps
	})

	const recursiveMap = (tracked, identifier, func, src, context) => {
		const storage = initOutput(tracked, src, identifier, emptyArr, recursiveCacheFunc)
		const out = storage[1]
		const invalidatedKeys = storage[2]
		const isNew = storage[3]
		const loop = storage[4]
		loop.invalidatedKeys = invalidatedKeys
		loop.out = out
		loop.context = context
		loop.func = func
		loop.src = src
		loop.isNew = isNew

		if (isNew) {
			for (let key = 0; key < src.length; key++) {
				invalidatedKeys.add(key)
			}
			for (let key = 0; key < src.length; key++) {
				loop.recursiveSteps(key, [invalidatedKeys, key])
			}
		} else {
			cascadeRecursiveInvalidations(loop)
			invalidatedKeys.forEach((key) => {
				loop.recursiveSteps(key, [invalidatedKeys, key])
			})
		}
		invalidatedKeys.clear()
		return out
	}

	const recursiveMapValues = (tracked, identifier, func, src, context) => {
		const storage = initOutput(tracked, src, identifier, emptyObj, recursiveCacheFunc)
		const out = storage[1]
		const invalidatedKeys = storage[2]
		const isNew = storage[3]
		const loop = storage[4]
		loop.invalidatedKeys = invalidatedKeys
		loop.out = out
		loop.context = context
		loop.func = func
		loop.src = src
		loop.isNew = isNew

		if (isNew) {
			Object.keys(src).forEach((key) => invalidatedKeys.add(key))
			Object.keys(src).forEach((key) => loop.recursiveSteps(key, invalidatedKeys, key))
		} else {
			cascadeRecursiveInvalidations(loop)
			invalidatedKeys.forEach((key) => {
				loop.recursiveSteps(key, invalidatedKeys, key)
			})
		}
		invalidatedKeys.clear()
		return out
	}

	const keyBy = (tracked, identifier, func, src, context) => {
		const storage = initOutput(tracked, src, identifier, emptyObj, emptyArr)
		const out = storage[1]
		const invalidatedKeys = storage[2]
		const isNew = storage[3]
		const cache = storage[4]
		if (isNew) {
			cache.indexToKey = []
			cache.keyToIndices = Object.create(null)
			for (let index = 0; index < src.length; index++) {
				const key = `${func([invalidatedKeys, index], index, src[index], context)}`
				cache.indexToKey[index] = key
				cache.keyToIndices[key] = cache.keyToIndices[key] || new Set()
				cache.keyToIndices[key].add(index)
				setOnObject(out, key, src[index], isNew)
			}
		} else {
			const keysPendingDelete = new Set()
			invalidatedKeys.forEach((index) => {
				if (index < cache.indexToKey.length) {
					const key = cache.indexToKey[index]
					cache.keyToIndices[key].delete(index)
					if (cache.keyToIndices[key].size === 0) {
						delete cache.keyToIndices[key]
						keysPendingDelete.add(key)
					}
				}
			})
			invalidatedKeys.forEach((index) => {
				if (index < src.length) {
					const key = `${func([invalidatedKeys, index], index, src[index], context)}`
					cache.indexToKey[index] = key
					keysPendingDelete.delete(key)
					cache.keyToIndices[key] = cache.keyToIndices[key] || new Set()
					cache.keyToIndices[key].add(index)
					setOnObject(out, key, src[index], isNew)
				}
			})

			keysPendingDelete.forEach((key) => {
				deleteOnObject(out, key, isNew)
			})
		}
		cache.indexToKey.length = src.length
		invalidatedKeys.clear()
		return out
	}

	const mapKeys = (tracked, identifier, func, src, context) => {
		const storage = initOutput(tracked, src, identifier, emptyObj, emptyObj)
		const out = storage[1]
		const invalidatedKeys = storage[2]
		const isNew = storage[3]
		const keyToKey = storage[4]
		if (isNew) {
			Object.keys(src).forEach((key) => {
				const newKey = func([invalidatedKeys, key], key, src[key], context)
				setOnObject(out, newKey, src[key], isNew)
				keyToKey[key] = newKey
			})
		} else {
			const keysPendingDelete = new Set()
			invalidatedKeys.forEach((key) => {
				if (keyToKey.hasOwnProperty(key)) {
					keysPendingDelete.add(keyToKey[key])
					delete keyToKey[key]
				}
			})
			invalidatedKeys.forEach((key) => {
				if (src.hasOwnProperty(key)) {
					const newKey = func([invalidatedKeys, key], key, src[key], context)
					setOnObject(out, newKey, src[key], isNew)
					keyToKey[key] = newKey
					keysPendingDelete.delete(newKey)
				}
			})
			keysPendingDelete.forEach((key) => {
				deleteOnObject(out, key, isNew)
			})
		}
		invalidatedKeys.clear()
		return out
	}

	const filterCacheFunc = () => [0]

	const filter = (tracked, identifier, func, src, context) => {
		const storage = initOutput(tracked, src, identifier, emptyArr, filterCacheFunc)
		const out = storage[1]
		const invalidatedKeys = storage[2]
		const isNew = storage[3]
		const idxToIdx = storage[4]
		if (isNew) {
			for (let key = 0; key < src.length; key++) {
				const passed = !!func([invalidatedKeys, key], key, src[key], context)
				const prevItemIdx = idxToIdx[key]
				const nextItemIdx = passed ? prevItemIdx + 1 : prevItemIdx
				idxToIdx[key + 1] = nextItemIdx
				if (nextItemIdx !== prevItemIdx) {
					setOnArray(out, prevItemIdx, src[key], isNew)
				}
			}
		} else {
			let firstIndex = Number.MAX_SAFE_INTEGER
			invalidatedKeys.forEach((key) => firstIndex = Math.min(firstIndex, key))
			for (let key = firstIndex; key < src.length; key++) {
				const passed = !!func([invalidatedKeys, key], key, src[key], context)
				const prevItemIdx = idxToIdx[key]
				const nextItemIdx = passed ? prevItemIdx + 1 : prevItemIdx
				idxToIdx[key + 1] = nextItemIdx
				if (nextItemIdx !== prevItemIdx) {
					setOnArray(out, prevItemIdx, src[key], isNew)
				}
			}
			idxToIdx.length = src.length + 1
			truncateArray(out, idxToIdx[idxToIdx.length - 1])
		}
		invalidatedKeys.clear()
		return out
	}

	const any = (tracked, identifier, func, src, context) => {
		const storage = initOutput(tracked, src, identifier, emptyArr, nullFunc)
		const out = storage[1]
		const invalidatedKeys = storage[2]
		const isNew = storage[3]
		// out has at most 1 key - the one that stopped the previous run because it was truthy
		if (isNew) {
			for (let key = 0; key < src.length; key++) {
				invalidatedKeys.add(key)
			}
		}
		const prevStop = out.length > 0 ? out[0] : -1
		if (prevStop >= 0 && prevStop < src.length) {
			if (invalidatedKeys.has(prevStop)) {
				invalidatedKeys.delete(prevStop)
				const passedTest = func([invalidatedKeys, prevStop], prevStop, src[prevStop], context)
				if (!passedTest) {
					out.length = 0
				}
			}
		} else {
			out.length = 0
		}
		if (out.length === 0) {
			for (const key of invalidatedKeys) {
				invalidatedKeys.delete(key)
				if (key >= 0 && key < src.length) {
					const match = func([invalidatedKeys, key], key, src[key], context)
					if (match) {
						out[0] = key
						break
					}
				}
			}
		}
		return out.length === 1
	}

	const anyValues = (tracked, identifier, func, src, context) => {
		const storage = initOutput(tracked, src, identifier, emptyArr, nullFunc)
		const out = storage[1]
		const invalidatedKeys = storage[2]
		const isNew = storage[3]
		// out has at most 1 key - the one that stopped the previous run because it was truthy
		if (isNew) {
			Object.keys(src).forEach((key) => invalidatedKeys.add(key))
		}
		const prevStop = out.length > 0 ? out[0] : null
		if (prevStop !== null && src.hasOwnProperty(prevStop)) {
			if (invalidatedKeys.has(prevStop)) {
				invalidatedKeys.delete(prevStop)
				const passedTest = func([invalidatedKeys, prevStop], prevStop, src[prevStop], context)
				if (!passedTest) {
					out.length = 0
				}
			}
		} else {
			out.length = 0
		}
		if (out.length === 0) {
			for (const key of invalidatedKeys) {
				invalidatedKeys.delete(key)
				if (src.hasOwnProperty(key)) {
					const match = func([invalidatedKeys, key], key, src[key], context)
					if (match) {
						out[0] = key
						break
					}
				}
			}
		}
		return out.length === 1
	}

	const groupBy = (tracked, identifier, func, src, context) => {
		const storage = initOutput(tracked, src, identifier, emptyObj, emptyObj)
		const out = storage[1]
		const invalidatedKeys = storage[2]
		const isNew = storage[3]
		const keyToKey = storage[4]
		if (Array.isArray(src)) {
			throw new Error('groupBy only works on objects')
		}
		if (isNew) {
			Object.keys(src).forEach((key) => {
				const result = `${func([invalidatedKeys, key], key, src[key], context)}`
				keyToKey[key] = result
				if (!out[result]) {
					setOnObject(out, result, {}, isNew)
				}
				setOnObject(out[result], key, src[key], isNew)
			})
		} else {
			const keysPendingDelete = Object.create(null)
			invalidatedKeys.forEach((key) => {
				if (keyToKey[key]) {
					keysPendingDelete[keyToKey[key]] = keysPendingDelete[keyToKey[key]] || new Set()
					keysPendingDelete[keyToKey[key]].add(key)
				}
			})
			invalidatedKeys.forEach((key) => {
				if (!src.hasOwnProperty(key)) {
					delete keyToKey[key]
					return
				}
				const result = `${func([invalidatedKeys, key], key, src[key], context)}`
				keyToKey[key] = result
				if (!out[result]) {
					out[result] = {}
				}
				setOnObject(out[result], key, src[key], isNew)
				setOnObject(out, result, out[result], isNew)
				if (keysPendingDelete[result]) {
					keysPendingDelete[result].delete(key)
				}
			})
			Object.keys(keysPendingDelete).forEach((result) => {
				if (keysPendingDelete[result].size > 0) {
					keysPendingDelete[result].forEach((key) => {
						deleteOnObject(out[result], key, isNew)
					})
					if (Object.keys(out[result]).length === 0) {
						deleteOnObject(out, result, isNew)
					} else {
						setOnObject(out, result, out[result], isNew)
					}
				}
			})
		}
		invalidatedKeys.clear()
		return out
	}

	const valuesOrKeysCacheFunc = () => ({keyToIdx: {}, idxToKey: []})

	const values = (tracked, src, identifier) => {
		const storage = initOutput(tracked, src, identifier, emptyArr, valuesOrKeysCacheFunc)
		const out = storage[1]
		const invalidatedKeys = storage[2]
		const isNew = storage[3]
		const {keyToIdx, idxToKey} = storage[4]

		if (isNew) {
			Object.keys(src).forEach((key, idx) => {
				out[idx] = src[key]
				idxToKey[idx] = key
				keyToIdx[key] = idx
			})
		} else {
			const deletedKeys = []
			const addedKeys = []
			const touchedKeys = []
			invalidatedKeys.forEach((key) => {
				if (src.hasOwnProperty(key) && !keyToIdx.hasOwnProperty(key)) {
					addedKeys.push(key)
				} else if (!src.hasOwnProperty(key) && keyToIdx.hasOwnProperty(key)) {
					deletedKeys.push(key)
				} else if (keyToIdx.hasOwnProperty(key)) {
					setOnObject(out, keyToIdx[key], src[key], isNew)
				}
			})
			if (addedKeys.length < deletedKeys.length) {
				deletedKeys.sort((a, b) => keyToIdx[a] - keyToIdx[b])
			}
			const finalOutLength = out.length - deletedKeys.length + addedKeys.length
			// keys both deleted and added fill created holes first
			for (let i = 0; i < addedKeys.length && i < deletedKeys.length; i++) {
				const addedKey = addedKeys[i]
				const deletedKey = deletedKeys[i]
				const isNewIdx = keyToIdx[deletedKey]
				delete keyToIdx[deletedKey]
				keyToIdx[addedKey] = isNewIdx
				idxToKey[isNewIdx] = addedKey
				setOnArray(out, isNewIdx, src[addedKey], isNew)
			}
			// more keys added - append to end
			for (let i = deletedKeys.length; i < addedKeys.length; i++) {
				const addedKey = addedKeys[i]
				const isNewIdx = out.length
				keyToIdx[addedKey] = isNewIdx
				idxToKey[isNewIdx] = addedKey
				setOnArray(out, isNewIdx, src[addedKey], isNew)
			}
			// more keys deleted - move non deleted items at the tail to the location of deleted
			const deletedNotMoved = deletedKeys.slice(addedKeys.length)
			const deletedNotMovedSet = new Set(deletedKeys.slice(addedKeys.length))
			const keysToMoveInside = new Set(idxToKey.slice(finalOutLength).filter((key) => !deletedNotMovedSet.has(key)))
			let savedCount = 0
			for (let tailIdx = finalOutLength; tailIdx < out.length; tailIdx++) {
				const currentKey = idxToKey[tailIdx]
				if (keysToMoveInside.has(currentKey)) {
					// need to move this key to one of the pending delete
					const switchedWithDeletedKey = deletedNotMoved[savedCount]
					const isNewIdx = keyToIdx[switchedWithDeletedKey]
					setOnArray(out, isNewIdx, src[currentKey], isNew)
					keyToIdx[currentKey] = isNewIdx
					idxToKey[isNewIdx] = currentKey
					delete keyToIdx[switchedWithDeletedKey]
					savedCount++
				} else {
					delete keyToIdx[currentKey]
				}
			}
			truncateArray(out, finalOutLength)
			idxToKey.length = out.length
			invalidatedKeys.clear()
		}
		return out
	}

	const keys = (tracked, src, identifier) => {
		const storage = initOutput(tracked, src, identifier, emptyArr, valuesOrKeysCacheFunc)
		const out = storage[1]
		const invalidatedKeys = storage[2]
		const isNew = storage[3]
		const {keyToIdx, idxToKey} = storage[4]

		if (isNew) {
			Object.keys(src).forEach((key, idx) => {
				out[idx] = key
				idxToKey[idx] = key
				keyToIdx[key] = idx
			})
		} else {
			const deletedKeys = []
			const addedKeys = []
			const touchedKeys = []
			invalidatedKeys.forEach((key) => {
				if (src.hasOwnProperty(key) && !keyToIdx.hasOwnProperty(key)) {
					addedKeys.push(key)
				} else if (!src.hasOwnProperty(key) && keyToIdx.hasOwnProperty(key)) {
					deletedKeys.push(key)
				} else if (keyToIdx.hasOwnProperty(key)) {
					setOnObject(out, keyToIdx[key], key, isNew)
				}
			})
			if (addedKeys.length < deletedKeys.length) {
				deletedKeys.sort((a, b) => keyToIdx[a] - keyToIdx[b])
			}
			const finalOutLength = out.length - deletedKeys.length + addedKeys.length
			// keys both deleted and added fill created holes first
			for (let i = 0; i < addedKeys.length && i < deletedKeys.length; i++) {
				const addedKey = addedKeys[i]
				const deletedKey = deletedKeys[i]
				const isNewIdx = keyToIdx[deletedKey]
				delete keyToIdx[deletedKey]
				keyToIdx[addedKey] = isNewIdx
				idxToKey[isNewIdx] = addedKey
				setOnArray(out, isNewIdx, addedKey, isNew)
			}
			// more keys added - append to end
			for (let i = deletedKeys.length; i < addedKeys.length; i++) {
				const addedKey = addedKeys[i]
				const isNewIdx = out.length
				keyToIdx[addedKey] = isNewIdx
				idxToKey[isNewIdx] = addedKey
				setOnArray(out, isNewIdx, addedKey, isNew)
			}
			// more keys deleted - move non deleted items at the tail to the location of deleted
			const deletedNotMoved = deletedKeys.slice(addedKeys.length)
			const deletedNotMovedSet = new Set(deletedKeys.slice(addedKeys.length))
			const keysToMoveInside = new Set(idxToKey.slice(finalOutLength).filter((key) => !deletedNotMovedSet.has(key)))
			let savedCount = 0
			for (let tailIdx = finalOutLength; tailIdx < out.length; tailIdx++) {
				const currentKey = idxToKey[tailIdx]
				if (keysToMoveInside.has(currentKey)) {
					// need to move this key to one of the pending delete
					const switchedWithDeletedKey = deletedNotMoved[savedCount]
					const isNewIdx = keyToIdx[switchedWithDeletedKey]
					setOnArray(out, isNewIdx, currentKey, isNew)
					keyToIdx[currentKey] = isNewIdx
					idxToKey[isNewIdx] = currentKey
					delete keyToIdx[switchedWithDeletedKey]
					savedCount++
				} else {
					delete keyToIdx[currentKey]
				}
			}
			truncateArray(out, finalOutLength)
			idxToKey.length = out.length
			invalidatedKeys.clear()
		}
		return out
	}

	const getEmptyArray = (tracked, token) => {
		const subKeys = tracked[0].subKeys
		if (!subKeys.has(tracked[1])) {
			subKeys.set(tracked[1], new Map())
		}
		const cachePerTargetKey = subKeys.get(tracked[1])
		if (!cachePerTargetKey.has(token)) {
			cachePerTargetKey.set(token, [])
		}
		return cachePerTargetKey.get(token)
	}

	const getEmptyObject = (tracked, token) => {
		const subKeys = tracked[0].subKeys
		if (!subKeys.has(tracked[1])) {
			subKeys.set(tracked[1], new Map())
		}
		const cachePerTargetKey = subKeys.get(tracked[1])
		if (!cachePerTargetKey.has(token)) {
			cachePerTargetKey.set(token, {})
		}
		return cachePerTargetKey.get(token)
	}

	const array = (tracked, newVal, identifier, len) => {
		const result = getEmptyArray(tracked, identifier)
		const isNew = result.length === 0
		for (let i = 0; i < len; i++) {
			setOnArray(result, i, newVal[i], isNew)
		}
		return result
	}

	const object = (tracked, valsList, identifier, keysList) => {
		const result = getEmptyObject(tracked, identifier)
		const isNew = keysList.length && !result.hasOwnProperty(keysList[0])
		for (let i = 0; i < keysList.length; i++) {
			const name = keysList[i]
			setOnObject(result, name, valsList[i], isNew)
		}
		return result
	}

	const call = (tracked, newVal, identifier, len) => {
		const arr = getEmptyArray(tracked, identifier)
		const isNew = arr.length === 0
		if (isNew) {
			arr.push([])
		}
		const args = arr[0]
		for (let i = 0; i < len; i++) {
			setOnArray(args, i, newVal[i], isNew)
		}
		if (arr.length === 1 || tainted.has(args)) {
			arr[1] = funcLib[args[0]].apply(res, args.slice(1))
		}
		return arr[1]
	}

	const bind = (tracked, newVal, identifier, len) => {
		const arr = getEmptyArray(tracked, identifier)
		if (arr.length === 0) {
			arr.push([])
		}
		const args = arr[0]
		for (let i = 0; i < len; i++) {
			args[i] = newVal[i]
		}
		if (arr.length === 1) {
			arr[1] = (...extraArgs) => {
				const fn = funcLibRaw[args[0]] || res[args[0]]
				return fn.apply(res, args.slice(1).concat(extraArgs))
			}
		}
		return arr[1]
	}

	const assign = (tracked, src, identifier) => {
		const storage = initOutput(tracked, src, identifier, emptyObj, nullFunc)
		const out = storage[1]
		const invalidatedKeys = storage[2]
		const isNew = storage[3]
		if (isNew) {
			Object.assign(out, ...src)
		} else {
			const result = Object.assign({}, ...src)
			Object.keys(result).forEach((key) => {
				setOnObject(out, key, result[key], isNew)
			})
			Object.keys(out).forEach((key) => {
				if (!result.hasOwnProperty(key)) {
					deleteOnObject(out, key, isNew)
				}
			})
			invalidatedKeys.clear()
		}
		return out
	}

	const defaults = (tracked, src, identifier) => {
		const storage = initOutput(tracked, src, identifier, emptyObj, nullFunc)
		const out = storage[1]
		const invalidatedKeys = storage[2]
		const isNew = storage[3]
		src = [...src].reverse()
		if (isNew) {
			Object.assign(out, ...src)
		} else {
			const result = Object.assign({}, ...src)
			Object.keys(result).forEach((key) => {
				setOnObject(out, key, result[key], isNew)
			})
			Object.keys(out).forEach((key) => {
				if (!result.hasOwnProperty(key)) {
					deleteOnObject(out, key, isNew)
				}
			})
			invalidatedKeys.clear()
		}
		return out
	}

	const flatten = (tracked, src, identifier) => {
		const storage = initOutput(tracked, src, identifier, emptyArr, emptyArr)
		const out = storage[1]
		const invalidatedKeys = storage[2]
		const isNew = storage[3]
		const cache = storage[4]
		const length = src.length
		const initialLength = out.length
		if (isNew) {
			for (let pos = 0, i = 0; i < length; i += 1) {
				cache[i] = src[i].length
				for (let j = 0; j < cache[i]; j += 1) {
					out[pos + j] = src[i][j]
				}
				pos += cache[i]
			}
		} else {
			let pos = 0
			for (let key = 0; key < length; key += 1) {
				let partLen = src[key].length
				if (invalidatedKeys.has(key)) {
					if (cache[key] && cache[key] === partLen) {
						// eslint-disable-next-line no-loop-func
						src[key].forEach((value, index) => setOnArray(out, pos + index, value, isNew))
						pos += cache[key]
					} else {
						for (; key < length; key += 1) {
							partLen = src[key].length
							// eslint-disable-next-line no-loop-func
							src[key].forEach((value, index) => setOnArray(out, pos + index, value, isNew))
							cache[key] = partLen
							pos += partLen
						}
					}
				} else {
					pos += partLen
				}
			}
			invalidatedKeys.clear()

			const shouldTruncateArray = initialLength !== pos
			if (shouldTruncateArray) {
				truncateArray(out, pos)
			}
		}

		return out
	}

	const size = (src) => Array.isArray(src) ? src.length : Object.keys(src).length

	const isEmpty = (src) => Array.isArray(src) ? src.length === 0 : Object.keys(src).length === 0

	const last = (src) => src[src.length - 1]

	const sum = (tracked, src, identifier) => {
		const storage = initOutput(tracked, src, identifier, emptyArr, emptyArr)
		const out = storage[1]
		const invalidatedKeys = storage[2]
		const isNew = storage[3]
		const cache = storage[4]
		const length = src.length
		if (isNew) {
			cache[0] = 0
			cache[1] = []
			for (let i = 0; i < length; i++) {
				cache[0] += src[i]
				cache[1][i] = src[i]
			}
		} else {
			invalidatedKeys.forEach((key) => {
				const cached = cache[1][key] || 0
				const live = src[key] || 0
				cache[0] = cache[0] - cached + live
				cache[1][key] = live
			})
			cache[1].length = length
			invalidatedKeys.clear()
		}
		out[0] = cache[0]
		return out[0]
	}

	const range = (tracked, end, start, step, identifier) => {
		const out = getEmptyArray(tracked, identifier)
		let result
		if (out.length === 0) {
			result = []
			out.push(result)
			// eslint-disable-next-line no-unmodified-loop-condition
			for (let val = start; step > 0 && val < end || step < 0 && val > end; val += step) {
				result.push(val)
			}
		} else {
			let len = 0
			result = out[0]
			// eslint-disable-next-line no-unmodified-loop-condition
			for (let val = start; step > 0 && val < end || step < 0 && val > end; val += step) {
				setOnArray(result, len, val, false)
				len++
			}
			if (result.length > len) {
				truncateArray(result, len)
			}
		}
		return result
	}

	const invalidatePath = (path) => {
		path.forEach((part, index) => {
			triggerInvalidations(getAssignableObject(path, index), part, index === path.length - 1)
		})
	}

	const set = (path, value) => {
		ensurePath(path)
		invalidatePath(path)
		applySetter(getAssignableObject(path, path.length - 1), path[path.length - 1], value)
	}

	const splice = (pathWithKey, len, ...newItems) => {
		ensurePath(pathWithKey)
		const key = pathWithKey[pathWithKey.length - 1]
		const path = pathWithKey.slice(0, pathWithKey.length - 1)
		const arr = getAssignableObject(path, path.length)
		const origLength = arr.length
		const end = len === newItems.length ? key + len : Math.max(origLength, origLength + newItems.length - len)
		for (let i = key; i < end; i++) {
			triggerInvalidations(arr, i, true)
		}
		invalidatePath(pathWithKey)
		arr.splice(key, len, ...newItems)
	}

	const push = (path, value) => {
		ensurePath([...path, 0])
		const arr = getAssignableObject(path, path.length)
		splice([...path, arr.length], 0, value)
	}

	return {
		any,
		anyValues,
		array,
		assign,
		bind,
		call,
		defaults,
		filter,
		filterBy,
		flatten,
		groupBy,
		isEmpty,
		keyBy,
		keys,
		last,
		map,
		mapKeys,
		mapValues,
		object,
		push,
		range,
		recursiveMap,
		recursiveMapValues,
		set,
		size,
		splice,
		sum,
		trackPath,
		values,

		// update library functions
		updateModel,
		resetTainted
	}
}

module.exports = {
	createLibrary
}
