import {
    VMParams,
    StepParams,
    GetterProjection,
    ProjectionType,
    InvalidatedRoots,
    Tracked,
    ProjectionMetaData,
    OptimizerFuncNonPredicate,
    Reference,
    SetterProjection,
    TopLevel,
    InvalidationPath
} from "./vm-types";

export const PrimitiveBits = 18
export const InvalidatesFlag = 1 << 1

export function packPrimitiveIndex(index: number) {
    return index | (1 << IndexBits);
}

export function unpackPrimitiveIndex(index: number) {
    return index & ((1 << IndexBits) - 1);
}

export function isPrimitiveIndex(index: number) {
    return index & (1 << IndexBits);
}

export function packProjectionIndex(index: number) {
    return index | ;
}

type ProjectionResult = any;

interface PublicScope {
    key: ProjectionResult;
    val: ProjectionResult;
    context: ProjectionResult;
    loop: ProjectionResult;
    topLevel: ProjectionResult[];
    root: any;
}

interface RuntimeState {
    $invalidatedRoots: InvalidatedRoots;
    $tracked: Tracked;
    trackingPhase ? : boolean;
}

interface EvalScope {
    args: (string | number)[];
    publicScope: PublicScope;
    runtimeState: RuntimeState;
    conds: {
        [key: number]: number;
    };
}

type Evaluator = (scope: EvalScope) => any;
type Resolver = (
    type: any,
    args: Evaluator[],
    index: number,
    metaData: ProjectionMetaData ,
    argsMetaData: Array <ProjectionMetaData>
) => Evaluator;

export function buildVM({
    $projectionData,
    library,
    $res,
    $funcLib,
    debugMode
}: VMParams) {
    const {
        getters,
        primitives,
        topLevelNames,
        topLevelProjections,
        metaData,
        setters,
        sources
    } = $projectionData;

    const invPaths = $projectionData.paths

    const {
        setOnArray
    } = library;
    const primitiveEvaluator = (value: any) => () => value
    const resolveArgRef = (ref: number): Evaluator =>
        isPrimitiveIndex(ref) ?
        primitiveEvaluator(primitives[unpackPrimitiveIndex(ref)]) :
        (scope: EvalScope) => evaluators[ref](scope);

    const scopeResolver = (key: string, args: Evaluator[], index: number) => (
        scope: EvalScope
    ) => scope.publicScope[key as keyof PublicScope];

    const context = (key: "context") => (scope: EvalScope) =>
        scope.runtimeState.trackingPhase ?
        scope.publicScope.context :
        scope.publicScope.context[0];

    const getInvalidates = (metaData?: ProjectionMetaData) => metaData ? !!(metaData[0] & InvalidatesFlag) : false

    const resolveTracking = ([flags, ...pathIndices]: ProjectionMetaData) => {
        const paths = pathIndices.map(index => invPaths[index]) as InvalidationPath[]
        if (!paths || !paths.length) {
            return () => {};
        }

        const tracks = paths.map(([cond, ...path]: Reference[]) => {
            const precond: Evaluator = cond ? resolveArgRef(cond) : () => true;
            const pathToTrack: Evaluator[] = (path || []).map(resolveArgRef);
            return (scope: EvalScope) => {
                const trackingScope = {
                    ...scope,
                    runtimeState: {
                        ...scope.runtimeState,
                        trackingPhase: true
                    }
                };
                return (
                    precond(trackingScope) &&
                    library.trackPath(
                        scope.runtimeState.$tracked,
                        pathToTrack.map(p => p(trackingScope))
                    )
                );
            };
        });

        return (scope: EvalScope) => tracks.forEach(t => t(scope));
    };

    const getMetaData = (projectionIndex: number) =>
        metaData[getters[projectionIndex][1]];

    const predicateFunction = (
        ev: Evaluator,
        metaData: ProjectionMetaData
    ) => {
        const tracking = resolveTracking(metaData);
        return (outerScope: EvalScope) => (
            $tracked: Tracked,
            key: ProjectionResult,
            val: ProjectionResult,
            context: ProjectionResult,
            loop: ProjectionResult
        ) => {
            const innerScope = {
                ...outerScope,
                conds: {},
                runtimeState: {
                    ...outerScope.runtimeState,
                    $tracked
                },
                publicScope: {
                    ...outerScope.publicScope,
                    key,
                    val,
                    context,
                    loop
                }
            }
            const result = ev(innerScope);
            tracking(innerScope);
            return result;
        };
    };
    const topLevelResolver = (...types: ('array' | 'object')[]) => (
        type: string,
        args: Evaluator[],
        index: number,
        metaData: ProjectionMetaData ,
        argsMetaData: Array < ProjectionMetaData>
    ) => {
        const pred = predicateFunction(args[0], argsMetaData[0]);
        const evalInput = args[1];
        const context = args[2];
        const evalContext = context ?
            (scope: EvalScope) =>
            library.array(
                scope.runtimeState.$tracked,
                [context(scope)],
                `${index}_arr`,
                1,
                true
            ) :
            () => null;
        const func = library[type as 'map'];
        const invalidates = getInvalidates(metaData);
        return (scope: EvalScope) => {
            const input = evalInput(scope)
            if (debugMode) {
                library.checkTypes(input, type, types, type, resolveSource(index) || '')
            }
            return func(
                scope.runtimeState.$tracked,
                index,
                pred(scope),
                evalInput(scope),
                evalContext(scope),
                invalidates
            );
        }
    };

    const topLevelNonPredicate = (...types: ('object' | 'array')[]) => (
        type: string,
        args: Evaluator[],
        index: number
    ) => {
        const func = library[
            type as keyof typeof library
        ] as OptimizerFuncNonPredicate;

        return (scope: EvalScope) => {
            const input = args[0](scope)
            if (debugMode) {
                library.checkTypes(input, type, types, type, resolveSource(index) || '')
            }
            return func(scope.runtimeState.$tracked, input, index);
        }
    }

    const range = (
        type: string,
        [end, start, step]: Evaluator[],
        index: number,
        metaData: ProjectionMetaData
    ) => {
        const func = library.range;
        const invalidates = getInvalidates(metaData);
        return (scope: EvalScope) =>
            func(
                scope.runtimeState.$tracked,
                end(scope),
                start(scope),
                step(scope),
                index,
                invalidates
            );
    };

    const assignOrDefaults = (
        type: string,
        args: Evaluator[],
        index: number,
        metaData: ProjectionMetaData
    ) => {
        const func = library.assignOrDefaults;
        const isAssign = type === "assign";
        return (scope: EvalScope) => {
            const input = args[0](scope)
            if (debugMode) {
                library.checkTypes(input, type, ['array'], type, resolveSource(index) || '')
            }

            return func(
                scope.runtimeState.$tracked,
                index,
                input,
                isAssign,
                getInvalidates(metaData)
            );
        }
    };

    const keysOrValues = (
        type: string,
        args: Evaluator[],
        index: number,
        metaData: ProjectionMetaData
    ) => {
        const func = library.valuesOrKeysForObject;
        const isValues = type === "values";
        return (scope: EvalScope) => {
            const input = args[0](scope)
            if (debugMode) {
                library.checkTypes(input, type, ['object'], type, resolveSource(index) || '')
            }
            return func(
                scope.runtimeState.$tracked,
                index,
                input,
                isValues,
                getInvalidates(metaData)
            );
        }
    };

    type StringFunc = (...args: any[]) => any;

    const nativeStringResolver = (
            func: StringFunc,
            self: Evaluator,
            args: Evaluator[]
        ) => (evalScope: EvalScope) =>
        func.apply(self(evalScope) as string, args.map(a => a(evalScope)));

    const stringResolver = (type: string, args: Evaluator[], index: number) =>
        nativeStringResolver(
            String.prototype[type as keyof string] as StringFunc,
            args[0],
            args.slice(1)
        );

    const call = (
            type: "call",
            args: Evaluator[],
            index: number,
            metaData: ProjectionMetaData
        ) => (evalScope: EvalScope) =>
        library.call(
            evalScope.runtimeState.$tracked,
            args.map(a => a(evalScope)),
            index,
            args.length,
            getInvalidates(metaData)
        );

    const effect = (
            type: "effect",
            args: Evaluator[]
        ) => (evalScope: EvalScope) => {
          const name = args[0](evalScope) as string
            ($res[name] || $funcLib[name]).apply($res, args.slice(1).map(a => a(evalScope)))
        }

    const bind = (
        type: "bind",
        args: Evaluator[],
        index: number,
        md: ProjectionMetaData
    ) => {
        const len = args.length;
        return (evalScope: EvalScope) =>
            library.bind(
                evalScope.runtimeState.$tracked,
                args.map(a => a(evalScope)),
                index,
                args.length,
                getInvalidates(md)
            );
    };

    const simpleResolver = (func: (...args: any[]) => any) => (
        type: string,
        args: Evaluator[]
    ) => (scope: EvalScope) => func(...args.map(a => a(scope)));

    const wrapCond = (test: Evaluator, id: number, index: number) =>
        id >= 0 ?
        (scope: EvalScope) => (scope.conds[id] = index) && test(scope) :
        test;

    const ternary = (
        name: "ternary",
        [evalID, test, then, alt]: Evaluator[],
        index: number,
        metaData: ProjectionMetaData
    ) => {
        const id = evalID({} as EvalScope)
        const thenWrapped = wrapCond(then, id, 2);
        const altWrapped = wrapCond(alt, id, 3);
        return (scope: EvalScope) =>
            test(scope) ? thenWrapped(scope) : altWrapped(scope);
    };

    const or = (
        name: "or",
        [evalID, ...args]: Evaluator[]) => {
        const id = evalID({} as EvalScope)
        return args.map((e, i) => wrapCond(e, id, i + 1))
            .reduce((current: any, next: Evaluator) => 
                (scope: EvalScope) => current(scope) || next(scope), () => false)
    };

    const and = (
        name: "and",
        [evalID, ...args]: Evaluator[]) => {
        const id = evalID({} as EvalScope)
        return args.map((e, i) => wrapCond(e, id, i + 1))
            .reduce((current: any, next: Evaluator) => 
                (scope: EvalScope) => current(scope) && next(scope), () => true)
    };

    const array = (
            name: "array",
            args: Evaluator[],
            index: number,
            metaData: ProjectionMetaData
        ) => (scope: EvalScope) =>
        library.array(
            scope.runtimeState.$tracked,
            args.map(a => a(scope)),
            index,
            args.length,
            getInvalidates(metaData)
        );

    const object = (
        name: "object",
        args: Evaluator[],
        index: number,
        metaData: ProjectionMetaData
    ) => {
        const keys: Evaluator[] = [];
        const values: Evaluator[] = [];
        args.forEach((a, i) => {
            if (i % 2) {
                values.push(args[i]);
            } else {
                keys.push(args[i]);
            }
        });
        return (scope: EvalScope) =>
            library.object(
                scope.runtimeState.$tracked,
                values.map(a => a(scope)),
                index,
                keys.map(a => a(scope)),
                getInvalidates(metaData)
            );
    };

    const recur = (name: "recur", [key, loop]: Evaluator[]) => (
        scope: EvalScope
    ) => key(scope).recursiveSteps(loop(scope), scope.runtimeState.$tracked);

    const argResolver = (name: string) => {
        const argMatch = name.match(/arg(\d)/);
        const index = argMatch ? +argMatch[1] : 0;
        return (scope: EvalScope) => scope.args[index];
    };

    const cond = (name: 'cond', [getNum]: Evaluator[]) => {
        return (scope: EvalScope) => scope.conds[getNum(scope)] || 0;
    }

    const trace = (name: "trace", args: Evaluator[]) => {
        const getLabel = args.length === 2 ? args[1] : null;
        const getValue = args.length === 2 ? args[1] : args[0];

        return (evalScope: EvalScope) => {
            const value = getValue(evalScope);
            console.log(getLabel ? getLabel(evalScope) + ", " : "", value);
            return value;
        };
    };

    const resolveFunc = (name: "func", [getExpr]: Evaluator[]) => getExpr;

    const breakpoint = (name: "breakpoint", [getValue]: Evaluator[]) => (
        evalScope: EvalScope
    ) => {
        const value = getValue(evalScope);
        debugger;
        return value;
    };

    const errorResolver = (name: string) => {
        throw new TypeError(`Invalid verb: ${name}`);
    };

    const resolveSource = (projectionIndex: number) => sources[projectionIndex]

    const mathResolver = (name: string, [getSrc]: Evaluator[], index: number) => {
        const func = debugMode ?
            library.mathFunction(name, resolveSource(index) || '') :
            Math[name as "ceil" | "floor" | "round"];
        return (evalScope: EvalScope) => func(getSrc(evalScope));
    };

    const resolvers: Partial < {
        [key in ProjectionType]: Resolver
    } > = {
        val: scopeResolver,
        key: scopeResolver,
        context,
        root: scopeResolver,
        topLevel: scopeResolver,
        loop: scopeResolver,
        call,
        effect,
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
        div: simpleResolver((a, b) => a / b),
        mod: simpleResolver((a, b) => a % b),
        not: simpleResolver(a => !a),
        null: simpleResolver(() => null),
        floor: mathResolver,
        ceil: mathResolver,
        round: mathResolver,
        quote: simpleResolver(a => a),
        isUndefined: simpleResolver(a => typeof a === "undefined"),
        isBoolean: simpleResolver(a => typeof a === "boolean"),
        isNumber: simpleResolver(a => typeof a === "number"),
        isString: simpleResolver(a => typeof a === "string"),
        abstract: errorResolver,
        invoke: errorResolver,
        func: resolveFunc,
        ternary,
        or,
        and,
        array,
        object,
        get: simpleResolver((obj, prop) => obj[prop]),
        stringLength: simpleResolver(a => a.length),
        parseInt: simpleResolver((a, radix) => parseInt(a, radix || 10)),
        map: topLevelResolver('array'),
        mapValues: topLevelResolver('object'),
        any: topLevelResolver('array'),
        anyValues: topLevelResolver('object'),
        recursiveMap: topLevelResolver('array'),
        recursiveMapValues: topLevelResolver('object'),
        filter: topLevelResolver('array'),
        filterBy: topLevelResolver('object'),
        keyBy: topLevelResolver('array'),
        groupBy: topLevelResolver('object'),
        mapKeys: topLevelResolver('object'),
        size: topLevelNonPredicate('object', 'array'),
        sum: topLevelNonPredicate('array'),
        flatten: topLevelNonPredicate('array'),
        range,
        assign: assignOrDefaults,
        defaults: assignOrDefaults,
        keys: keysOrValues,
        values: keysOrValues,
        trace,
        breakpoint,
        bind,
        recur,
        cond,
        arg0: argResolver,
        arg1: argResolver,
        arg2: argResolver,
        arg3: argResolver,
        arg4: argResolver,
        arg5: argResolver,
        arg6: argResolver,
        arg7: argResolver,
        arg8: argResolver,
        arg9: argResolver
    };

    const buildEvaluator = (
        getter: GetterProjection,
        index: number
    ): Evaluator => {
        const [typeIndex, getterMetadata, ...argRefs] = getter;
        const md = metaData[getterMetadata];
        const type = primitives[typeIndex] as keyof typeof resolvers;
        const args = argRefs.map(resolveArgRef);
        if (!resolvers[type]) {
            throw new Error(`${type} is not implemented`);
        }
        const evaluator = (resolvers[type] as Resolver)(
            type,
            args,
            index,
            md,
            argRefs.map(arg => (isPrimitiveIndex(arg) ? [0] as ProjectionMetaData : getMetaData(arg)))
        );
        return evaluator;
    };
    const evaluators: Evaluator[] = getters.map(buildEvaluator);
    const topLevelResults: ProjectionResult[] = [];

    const topLevelEvaluators: [string | null, Evaluator][] = topLevelProjections.map(
        (projectionIndex: number, i: number) => {
            const name = topLevelNames[i]
            const evaluator = evaluators[projectionIndex];
            const md = getMetaData(projectionIndex);
            const tracking = resolveTracking(md);
            return [name, (outerScope: EvalScope) => {
                const evalScope = {...outerScope, conds: {}}
                const result = evaluator(evalScope);
                tracking(evalScope);
                return result;
            }] as [string | null, Evaluator]
        }
    );

    setters.forEach((s: SetterProjection) => {
        const [typeIndex, nameIndex, numTokens, ...projections] = s;
        const name = primitives[nameIndex];
        const type = primitives[typeIndex] as "push" | "splice" | "set";
        const path = projections.map(resolveArgRef);
        $res[name] = library.$setter.bind(null, (...args: any[]) =>
            library[type](
                path.map((arg: Evaluator) => arg({args} as EvalScope)),
                ...args.slice(numTokens)
            )
        );
    });

    function step({
        $first,
        $invalidatedRoots,
        $model
    }: StepParams) {
        topLevelEvaluators.forEach(([name, evaluator]: [string | null, Evaluator], i: number) => {
            if (!$first && !$invalidatedRoots.has(i)) {
                return
            }

            const result = evaluator({
                publicScope: {
                    root: $model,
                    topLevel: topLevelResults,
                    key: null,
                    val: null,
                    context: null,
                    loop: null
                },
                args: [],
                conds: {},
                runtimeState: {
                    $invalidatedRoots,
                    $tracked: [$invalidatedRoots, i]
                }
            });
            setOnArray(topLevelResults, i, result, true);
            if (!$first) {
                $invalidatedRoots.delete(i);
            }
            if (name) {
                $res[name] = result;
            }
        });
    }

    return {
        step
    };
}