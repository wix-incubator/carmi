import {VMParams, StepParams, GetterProjection, ProjectionType, InvalidatedRoots, Tracked} from './types'
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
    $res: {[name: string]: ProjectionResult}
}

interface EvalScope {
    publicScope: PublicScope
    runtimeState: RuntimeState
}


type Evaluator = (scope: EvalScope) => any
type Resolver = (type: any, args: Evaluator[], index: number) => Evaluator

export function buildVM({$projectionData, $funcLib, $funcLibRaw, library}: VMParams) {
    const {getters, primitives, topLevels} = $projectionData
    const {setOnArray} = library
    const primitiveEvaluator = (value: any) => () => value
    const resolveArgRef = (ref: number) : Evaluator => 
        isPrimitiveIndex(ref) ? primitiveEvaluator(primitives[unpackPrimitiveIndex(ref)]): (scope: EvalScope) => evaluators[ref](scope)

    const scopeResolver = (key: string, args: Evaluator[], index: number) => (scope: EvalScope) => scope.publicScope[key as keyof PublicScope] 
    const predicateFunction = (ev: Evaluator, outerScope: EvalScope) =>
         ($tracked: Tracked, key: ProjectionResult, val: ProjectionResult, context: ProjectionResult, loop: ProjectionResult) => 
            ev({...outerScope, publicScope: {...outerScope.publicScope, key, val, context, loop}})

    const topLevelResolver = (type: string, args: Evaluator[], index: number) => (scope: EvalScope) => {
        const {$tracked} = scope.runtimeState
        return library[type as 'map']($tracked, index, predicateFunction(args[0], scope), args[1](scope), args[2] ? args[2](scope) : null, true)
    }
   
    type StringFunc = (...args: any[]) => any

    const nativeStringResolver = (func: StringFunc, self: Evaluator, args: Evaluator[]) =>  
        (evalScope: EvalScope) =>
        {debugger; return func.apply(self(evalScope) as string, args.map(a => a(evalScope)))}
    const stringResolver = (type: string, args: Evaluator[], index: number) => nativeStringResolver(String.prototype[type as keyof string] as StringFunc, args[0], args.slice(1))

    // TODO: invalidates
    const callResolver = (type: 'call' | 'effect', args: Evaluator[], index: number) =>
        (evalScope: EvalScope) =>
            library.call(evalScope.runtimeState.$tracked, args.map(a => a(evalScope)), index, args.length, true)

    const resolvers : Partial<{[key in ProjectionType]: Resolver}> = {
        val: scopeResolver,
        root: scopeResolver,
        call: callResolver,
        startsWith: stringResolver,
        endsWith: stringResolver,
        substring: stringResolver,
        toLowerCase: stringResolver,
        toUpperCase: stringResolver,
        split: stringResolver,
        stringLength: (type, [src], md) => (scope: EvalScope) => src(scope).length,
        parseInt: (type, [src, radix], md) => (scope: EvalScope) => parseInt(src(scope), radix(scope) || 10),
        map: topLevelResolver
    }

    const buildEvaluator = (getter: GetterProjection, index: number) : Evaluator => {
        const [typeIndex, argRefs, metaData] = getter
        const type = primitives[typeIndex] as keyof typeof resolvers
        const args = argRefs.map(resolveArgRef)
        return (resolvers[type] as Resolver)(type, args, index)
    }
    const evaluators : Evaluator[] = getters.map(buildEvaluator)
    const topLevelResults : ProjectionResult[] = []
    const topLevelEvaluators = topLevels.map(({name, projectionIndex}, index) => (evalScope: EvalScope) => {
        const result = evaluators[projectionIndex](evalScope)
        topLevelResults[index] = result
        debugger
        if (name) {
            evalScope.runtimeState.$res[name] = result
        }
    })

    function step({$first, $invalidatedRoots, $tainted, $res, $model}: StepParams) {
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
                $res,
                $tracked: []
            }
        }
        topLevelEvaluators.forEach((evaluator, i) => {
            if ($first || $invalidatedRoots.has(i)) {
                const newValue = evaluator({...evalScope, runtimeState: {...evalScope.runtimeState, $tracked: [$invalidatedRoots, i]}});
                setOnArray(topLevelResults, i, newValue, true);
                if (!$first) {
                  $invalidatedRoots.delete(i);
                }
            }
        })
    }

    return {step}
}
