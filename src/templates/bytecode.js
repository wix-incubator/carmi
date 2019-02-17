
const {base,} = require('./naive');
const {library} = require('./optimizing');

function types() {
    
}
function extendedLibrary() {
    const collectionVerbs = {
        filterBy: filterByOpt,
        mapValues: mapValuesOpt,
        groupBy: groupByOpt,
        map: mapOpt,
        filter: filterOpt,
        mapKeys: mapKeysOpt,
        any: anyOpt,
        keyBy: keyByOpt,
        anyValues: anyValuesOpt,
        recursiveMap: recursiveMapOpt,
        recursiveMapValues: recursiveMapValuesOpt
    }

    const stringPrototypeResolvers = ['toUpperCase', 'toLowerCase', 'startsWith', 'endsWith', 'split', 'substring']
    const mathResolvers = ['floor', 'ceil', 'round']
    const scopeResolvers = ['loop', 'val', 'key', 'context', 'root', 'topLevel']

    const assign = (a, v) => Object.assign(a, v)
    const leafResolvers = {
        not: self => !self,
        isBoolean: self => typeof self === 'boolean',
        isNumber: self => typeof self === 'number',
        isString: self => typeof self === 'string',
        isUndefined: self => typeof self === 'undefined',
        ...stringPrototypeResolvers.map(f => ((...args) => f.call(...args))).reduce(assign, {}),
        ...mathResolvers.map(f => n => Math[f](n)).reduce(assign, {}),
        isArray: self => Array.isArray(self),
        stringLength: self => self.length,
        eq: (self, other) => self === other,
        lt: (self, other) => self < other,
        lte: (self, other) => self >= other,
        gt: (self, other) => self > other,
        gte: (self, other) => self >= other,
        plus: (self, other) => self + other,
        minus: (self, other) => self - other,
        mult: (self, other) => self * other,
        div: (self, other) => self / other,
        mod: (self, other) => self % other,
        breakpoint: self => {
            debugger
            return self
        },
        null: () => null,
        // TODO: cond tracking
        or: (...args) => args.reduce((a, b) => a || b, false),
        and: (...args) => args.reduce((a, b) => a && b, false),
        get: (prop, self) => self[prop],
        parseInt
      }

    function resolveCollection(collection) {
        const {type, index, args, invalidates} = collection
        return evalContext => {
            const [predicate, src, context] = args.map(a => a(evalContext))
            return collectionVerbs[type](evalContext.tracked, index, predicate, src, context, invalidates)
        }
    }

    const resolveLeaf = ({type, args}) => evalContext => 
        leafResolvers[type](...((args || []).map(arg => arg(evalContext))))

    const resolveScopeKey = ({type}) => ({scope}) => scope[type]
    const resolveArg = index => () => ({args}) => args[index]

    const resolveTrace = ({args, source}) =>
        evalContext => {
            const [value, label] = args.map(a => a(evalContext))
            console.log(label, value, {source})
            return value
        }

    function resolveFunc({args, source}) {
        const [evaluator] = args
        return evalContext => (($tracked, key, val, context, loop) => {
            // TODO: tracking
            const value = evaluator(
            {
                ...evalContext,
                scope: {...evalContext.scope, key, val, context, loop}
            })

            return value
        })
    }

    const resolvers = [
        ...Object.keys(collectionVerbs).map(key => ({[key]: resolveCollection})),
        ...Object.keys(leafResolvers).map(key => ({[key]: resolveLeaf})),
        ...scopeResolvers.map(key => ({[key]: resolveScopeKey})),
        ...[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(argIndex => ({[`arg${argIndex}`]: resolveArg(argIndex)}))
    ].reduce(assign, {
        trace: resolveTrace,
        func: resolveFunc
    })

    function buildTopLevel({index, expression, name}, {evaluate}) {
        const tracked = [$invalidatedRoots, index]
        const scope = {
            root: $model,
            topLevel: $topLevel
        }
        const evalContext = {
            tracked,
            scope
        }
        debugger
        const newValue = evaluate(expression, evalContext)

        // TODO: $INVALIDATES
        setOnObject($topLevel, index, newValue, true);
        $res[name] = newValue;
        $invalidatedRoots.delete(index);

        // TODO: track
        return $topLevel[index];
    }

    function doSet(object, key, value) {
        console.log(object, key, value)
        if (typeof value === 'undefined') {
            delete object[key]
        } else {
            object[key] = value
        }
    }

    function doSplice(start, deleteCount, object, key, value) {
        object[key].splice(start, deleteCount, value)
    }

    function setRecursive(object, path, value, setFunc) {
        debugger
        if (path.length === 1) {
            setFunc(object, path[0], value)
        } else {
            setRecursive(object[path[0]], path.slice(1), value, setFunc)
        }
    }

    const setterResolvers = [
        path => (...args) => {
            const runtimePath = path.map(p => p({args}))
            const value = args[args.length - 1]
            setRecursive($res, runtimePath, value, doSet)
        },
        path => (start, deleteCount, ...args) => {
            const runtimePath = path.map(p => p({args}))
            const value = args[args.length - 1]
            setRecursive($res, runtimePath, value, (...args) => doSplice(start, deleteCount, ...args))
        },
        () => () => {}
    ]

    let $topLevelEvaluators = null
    function derive() {
        if ($first) {
            $topLevelEvaluators.forEach(build => build())
        } else {
            $invalidatedRoots.forEach(index => $topLevelEvaluators.get(index)())
        }
    }

    function buildByteCode({setters, getters, primitives, topLevels, tokenTypes}) {
        const resolvedGetters = []
        const resolvedSetters = {}
        debugger
        getters = getters.map(([type, args, [invalidates, dependants, trackingExpression], source]) => 
            ({type: tokenTypes[type], args, invalidates, dependants, trackingExpression, source: primitives[source]}))
        const query = [index => () => primitives[index], resolveExpression]
        const unpackRef = ref => query[ref >> 24](ref & 0xFFFFFF)
        function resolveExpression(index) {
            const expr = getters[index]
            if (!resolvers[expr.type]) {
                debugger
                throw new TypeError(`Missing resolver for ${expr.type}`)
            }
            return resolvedGetters[index] || (resolvedGetters[index] = resolvers[expr.type]({
                type: expr.type,
                source: expr.source,
                index,
                invalidates: expr.invalidates,
                dependants: (expr.dependants || []).map(({condition, path}) => ({condition: unpackRef(condition), path: (path || []).map(unpackRef)})),
                args: (expr.args || []).map(unpackRef)
            }))
        }
        
        const evaluators = getters.map((e, i) => resolveExpression(i))
        const evaluate = (expression, evalContext) => evaluators[expression](evalContext)

        for (let name in setters) {
            const [type, ...path] = setters[name]
            resolvedSetters[name] = setterResolvers[type](path.map(unpackRef))
            $res[name] = (...args) => $setter(resolvedSetters[name], ...args)
        }

        $topLevelEvaluators = new Map(topLevels.map(topLevel => [topLevel.index, () => buildTopLevel(topLevel, {evaluate})]))
    }

}

module.exports = {
  base,
  library,
  extendedLibrary
};
