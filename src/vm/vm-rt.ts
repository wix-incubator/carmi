import { VMParams, StepParams, GetterProjection, ProjectionType, InvalidatedRoots, Tracked, ProjectionMetaData, OptimizerFuncNonPredicate, SetterProjection } from './types'
import { call } from '../../typings';

export function packPrimitiveIndex(index: number) {
    return index | 0x1000000
}

export function unpackPrimitiveIndex(index: number) {
    return index & 0xFFFFFF
}

export function isPrimitiveIndex(index: number) {
    return index & 0x1000000
}

export function packProjectionIndex(index: number) {
    return index
}

type ProjectionResult = any

interface PublicScope {
    key: ProjectionResult
    val: ProjectionResult
    context: ProjectionResult
    loop: ProjectionResult
    topLevel: ProjectionResult[]
    root: any
}

interface RuntimeState {
    $invalidatedRoots: InvalidatedRoots
    $tracked: Tracked
}

interface EvalScope {
    args: (string | number)[]
    publicScope: PublicScope
    runtimeState: RuntimeState
    conds: { [key: number]: number }
}


type Evaluator = (scope: EvalScope) => any
type Resolver = (type: any, args: Evaluator[], index: number, metaData: Partial<ProjectionMetaData>) => Evaluator

export function buildVM({ $projectionData, $funcLib, $funcLibRaw, library, $res }: VMParams) {
    const { getters, primitives, topLevels, metaData, setters } = $projectionData
    const { setOnArray } = library
    const primitiveEvaluator = (value: any) => () => value
    const resolveArgRef = (ref: number): Evaluator =>
        isPrimitiveIndex(ref) ? primitiveEvaluator(primitives[unpackPrimitiveIndex(ref)]) : (scope: EvalScope) => evaluators[ref](scope)

    const scopeResolver = (key: string, args: Evaluator[], index: number) => (scope: EvalScope) => scope.publicScope[key as keyof PublicScope]
    const predicateFunction = (ev: Evaluator, outerScope: EvalScope) =>
        ($tracked: Tracked, key: ProjectionResult, val: ProjectionResult, context: ProjectionResult, loop: ProjectionResult) =>
            ev({ ...outerScope, publicScope: { ...outerScope.publicScope, key, val, context, loop } })

    const topLevelResolver = (type: string, args: Evaluator[], index: number) => (scope: EvalScope) => {
        const tracked = scope.runtimeState.$tracked
        if (!library.hasOwnProperty(type)) {
            console.log(type)
        }
        return library[type as 'map'](tracked, index, predicateFunction(args[0], scope), args[1](scope), args[2] ? args[2](scope) : null, true)
    }

    const topLevelNonPredicate = (type: string, args: Evaluator[], index: number) => {
        const func = library[type as keyof typeof library] as OptimizerFuncNonPredicate
        return (scope: EvalScope) =>
            func(scope.runtimeState.$tracked, args[0](scope), index)
    }

    const assignOrDefaults = (type: string, args: Evaluator[], index: number, metaData: Partial<ProjectionMetaData>) => {
        const func = library.assignOrDefaults
        const isAssign = type === 'assign'
        return (scope: EvalScope) =>
            func(scope.runtimeState.$tracked, index, args[0](scope), isAssign, !!metaData.invalidates)
    }

    type StringFunc = (...args: any[]) => any

    const nativeStringResolver = (func: StringFunc, self: Evaluator, args: Evaluator[]) =>
        (evalScope: EvalScope) =>
            func.apply(self(evalScope) as string, args.map(a => a(evalScope)))

    const stringResolver = (type: string, args: Evaluator[], index: number) => nativeStringResolver(String.prototype[type as keyof string] as StringFunc, args[0], args.slice(1))

    // TODO: invalidates
    const call = (type: 'call' | 'effect', args: Evaluator[], index: number) =>
        (evalScope: EvalScope) =>
            library.call(evalScope.runtimeState.$tracked, args.map(a => a(evalScope)), index, args.length, true)

    const bind = (type: 'bind', args: Evaluator[], index: number, md: Partial<ProjectionMetaData>) => {
        const len = args.length
        return (evalScope: EvalScope) =>
            library.bind(evalScope.runtimeState.$tracked, args.map(a => a(evalScope)), index, args.length, !!md.invalidates)
    }
    
    const simpleResolver = (func: (...args: any[]) => any) =>
        (type: string, args: Evaluator[], index: number) =>
            (scope: EvalScope) => func(...args.map(a => a(scope)))

    const wrapCond = (test: Evaluator, index: number, tracked: boolean) =>
        tracked ? (scope: EvalScope) => (scope.conds[index] = index) && test(scope) : test

    const ternary = (name: 'ternary', [test, then, alt]: Evaluator[], index: number, metaData: Partial<ProjectionMetaData>) => {
        const tracked = !!metaData.tracked
        const thenWrapped = wrapCond(then, 2, tracked)
        const altWrapped = wrapCond(alt, 3, tracked)
        return (scope: EvalScope) =>
            test(scope) ? thenWrapped(scope) : altWrapped(scope)
    }

    const or = (name: 'or', args: Evaluator[], index: number, metaData: Partial<ProjectionMetaData>) => {
        const tracked = !!metaData.tracked
        const wrappedArgs = args.map((e, index) => wrapCond(e, index + 1, tracked))
        return (scope: EvalScope) => wrappedArgs.reduce((current: any, next: Evaluator) => current || next(scope), false)
    }

    const and = (name: 'and', args: Evaluator[], index: number, metaData: Partial<ProjectionMetaData>) => {
        const tracked = !!metaData.tracked
        const wrappedArgs = args.map((e, index) => wrapCond(e, index + 1, tracked))
        return (scope: EvalScope) => wrappedArgs.reduce((current: any, next: Evaluator) => current && next(scope), true)
    }

    const array = (name: 'array', args: Evaluator[], index: number, metaData: Partial<ProjectionMetaData>) =>
        (scope: EvalScope) =>
            library.array(scope.runtimeState.$tracked, args.map(a => a(scope)), index, args.length, !!metaData.invalidates)

    const object = (name: 'object', args: Evaluator[], index: number, metaData: Partial<ProjectionMetaData>) => {
        const keys : Evaluator[] = []
        const values : Evaluator[]= []
        args.forEach((a, i) => {
            if (i % 1) {
                values.push(args[i])
            } else {
                keys.push(args[i])
            }            
        })
        return (scope: EvalScope) =>
            library.object(scope.runtimeState.$tracked, values.map(a => a(scope)), index, keys.map(a => a(scope)), !!metaData.invalidates)
    }

    const recur = (name: 'recur', [key, loop]: Evaluator[], index: number, metaData: Partial<ProjectionMetaData>) =>
        (scope: EvalScope) =>
            key(scope).recursiveSteps(loop(scope), scope.runtimeState.$tracked)

    const argResolver = (name: string) => {
        const argMatch = name.match(/arg(\d)/)
        const index = argMatch ? +argMatch[1] : 0
        return (scope: EvalScope) => scope.args[index]
    }

    const resolvers: Partial<{ [key in ProjectionType]: Resolver }> = {
        val: scopeResolver,
        key: scopeResolver,
        root: scopeResolver,
        topLevel: scopeResolver,
        loop: scopeResolver,
        call,
        effect: call,
        startsWith: stringResolver,
        endsWith: stringResolver,
        substring: stringResolver,
        toLowerCase: stringResolver,
        toUpperCase: stringResolver,
        split: stringResolver,
        isArray: simpleResolver(Array.isArray),
        eq: simpleResolver((a, b) => a === b),
        gt: simpleResolver((a, b) => a > b),
        gte: simpleResolver((a, b) => a >= b),
        lt: simpleResolver((a, b) => a < b),
        lte: simpleResolver((a, b) => a <= b),
        minus: simpleResolver((a, b) => a - b),
        plus: simpleResolver((a, b) => a + b),
        mult: simpleResolver((a, b) => a * b),
        mod: simpleResolver((a, b) => a % b),
        not: simpleResolver(a => !a),
        null: simpleResolver(() => null),
        ternary,
        or,
        and,
        array,
        object,
        get: simpleResolver((obj, prop) => obj[prop]),
        stringLength: simpleResolver(a => a.length),
        parseInt: simpleResolver((a, radix) => parseInt(a, radix || 10)),
        map: topLevelResolver,
        any: topLevelResolver,
        recursiveMap: topLevelResolver,
        filter: topLevelResolver,
        keyBy: topLevelResolver,
        size: topLevelNonPredicate,
        sum: topLevelNonPredicate,
        range: topLevelNonPredicate,
        flatten: topLevelNonPredicate,
        assign: assignOrDefaults,
        defaults: assignOrDefaults,
        bind,
        recur,
        arg0: argResolver
    }
    const buildEvaluator = (getter: GetterProjection, index: number): Evaluator => {
        const [typeIndex, argRefs, getterMetadata] = getter
        const md = metaData[getterMetadata]
        const type = primitives[typeIndex] as keyof typeof resolvers
        const args = argRefs.map(resolveArgRef)
        if (!resolvers[type]) {
            throw new Error(`${type} is not implemented`)
        }
        return (resolvers[type] as Resolver)(type, args, index, md)
    }
    const evaluators: Evaluator[] = getters.map(buildEvaluator)
    const topLevelResults: ProjectionResult[] = []
    const topLevelEvaluators = topLevels.map(([projectionIndex, name], index) => (evalScope: EvalScope) => {
        const result = evaluators[projectionIndex](evalScope)
        topLevelResults[index] = result
        if (name) {
           $res[name] = result
        }
        return result
    })


    setters.forEach((s: SetterProjection) => {
        debugger
        const [typeIndex, nameIndex, projections, numTokens] = s
        const name = primitives[nameIndex]
        const type = primitives[typeIndex] as 'push' | 'splice' | 'set'
        const path = projections.map(resolveArgRef)
        $res[name] = library.$setter.bind(null, (...args: any[]) =>
            library[type](path.map(arg => arg( {args} as EvalScope)), args.slice(numTokens)))
    })


    function step({ $first, $invalidatedRoots, $tainted, $model }: StepParams) {
        debugger
        const evalScope: EvalScope = {
            publicScope: {
                root: $model,
                topLevel: topLevelResults,
                key: null,
                val: null,
                context: null,
                loop: null
            },

            runtimeState: {
                $invalidatedRoots,
                $tracked: []
            },
            args: [],
            conds: {}
        }
        topLevelEvaluators.forEach((evaluator, i) => {
            if ($first || $invalidatedRoots.has(i)) {
                const newValue = evaluator({ ...evalScope, runtimeState: { ...evalScope.runtimeState, $tracked: [$invalidatedRoots, i] } });
                setOnArray(topLevelResults, i, newValue, true);
                if (!$first) {
                    $invalidatedRoots.delete(i);
                }
            }
        })
    }

    return { step }
}
