import {
  VMParams,
  StepParams,
  GetterProjection,
  ProjectionType,
  InvalidatedRoots,
  Tracked,
  ProjectionMetaData,
  OptimizerFuncNonPredicate,
  SetterProjection,
  VMOptions,
  ProjectionData
} from "./types";
import { call } from "../../typings";
import { Reference, Source } from "./types";

export function packPrimitiveIndex(index: number) {
  return index | 0x1000000;
}

export function unpackPrimitiveIndex(index: number) {
  return index & 0xffffff;
}

export function isPrimitiveIndex(index: number) {
  return index & 0x1000000;
}

export function packProjectionIndex(index: number) {
  return index;
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
  trackingPhase?: boolean;
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
  metaData: Partial<ProjectionMetaData>,
  argsMetaData: Array<Partial<ProjectionMetaData>>
) => Evaluator;

export function buildVM(
  { $projectionData, library, $res }: VMParams,
  { debugMode }: VMOptions
) {
  const {
    getters,
    primitives,
    topLevels,
    metaData,
    setters,
    sources
  } = $projectionData;
  const { setOnArray } = library;
  const primitiveEvaluator = (value: any) => {
    if (typeof value === "undefined") {
      debugger;
    }
    return () => value;
  };
  const resolveArgRef = (ref: number): Evaluator =>
    isPrimitiveIndex(ref)
      ? primitiveEvaluator(primitives[unpackPrimitiveIndex(ref)])
      : (scope: EvalScope) => evaluators[ref](scope);

  const scopeResolver = (key: string, args: Evaluator[], index: number) => (
    scope: EvalScope
  ) => scope.publicScope[key as keyof PublicScope];

  const context = (key: "context") => (scope: EvalScope) =>
    scope.runtimeState.trackingPhase
      ? scope.publicScope.context
      : scope.publicScope.context[0];

  const resolvePretracking = (
    { paths, trackedExpr }: Partial<ProjectionMetaData> = {
      paths: [],
      trackedExpr: []
    }
  ): ((e: EvalScope) => EvalScope) => {
    const hasPath = paths && !!paths.length;
    debugger
    const hasConds = trackedExpr && !!trackedExpr.length;
    if (!hasPath || !hasConds) {
      return (e: EvalScope) => e;
    }

    const conds = (trackedExpr || [])
      .reduce(
        (a, c) => ({
          ...a,
          [c]: 0
        }),
        {}
      );

      return (evalScope: EvalScope) => ({
      ...evalScope,
      conds: {...conds}
    });
  };

  const resolveTracking = (
    { paths }: Partial<ProjectionMetaData> = { paths: [] }
  ) => {
    if (!paths || !paths.length) {
      return () => {};
    }

    const tracks = paths.map(([cond, path]: [Reference, Reference[]]) => {
      const precond: Evaluator = cond ? resolveArgRef(cond) : () => true;
      const pathToTrack: Evaluator[] = (path || []).map(resolveArgRef);
      return (scope: EvalScope) => {
        const trackingScope = {
          ...scope,
          runtimeState: { ...scope.runtimeState, trackingPhase: true }
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
    metaData[getters[projectionIndex][2]];

  const predicateFunction = (
    ev: Evaluator,
    metaData: Partial<ProjectionMetaData>
  ) => {
    const tracking = resolveTracking(metaData);
    const pretracking = resolvePretracking(metaData);
    return (outerScope: EvalScope) => (
      $tracked: Tracked,
      key: ProjectionResult,
      val: ProjectionResult,
      context: ProjectionResult,
      loop: ProjectionResult
    ) => {
      const innerScope = pretracking({
        ...outerScope,
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
      });
      const result = ev(innerScope);
      tracking(innerScope);
      return result;
    };
  };

  const topLevelResolver = (
    type: string,
    args: Evaluator[],
    index: number,
    metaData: Partial<ProjectionMetaData>,
    argsMetaData: Array<Partial<ProjectionMetaData>>
  ) => {
    const pred = predicateFunction(args[0], argsMetaData[0]);
    const evalSource = args[1];
    const context = args[2];
    const evalContext = context
      ? (scope: EvalScope) =>
          library.array(
            scope.runtimeState.$tracked,
            [context(scope)],
            `${index}_arr`,
            1,
            true
          )
      : () => null;
    const func = library[type as "map"];
    const invalidates = !!metaData.invalidates;
    return (scope: EvalScope) =>
      func(
        scope.runtimeState.$tracked,
        index,
        pred(scope),
        evalSource(scope),
        evalContext(scope),
        invalidates
      );
  };

  const topLevelNonPredicate = (
    type: string,
    args: Evaluator[],
    index: number
  ) => {
    const func = library[
      type as keyof typeof library
    ] as OptimizerFuncNonPredicate;
    return (scope: EvalScope) =>
      func(scope.runtimeState.$tracked, args[0](scope), index);
  };
  const range = (
    type: string,
    [end, start, step]: Evaluator[],
    index: number,
    metaData: Partial<ProjectionMetaData>
  ) => {
    const func = library.range;
    const invalidates = !!metaData.invalidates;
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
    metaData: Partial<ProjectionMetaData>
  ) => {
    const func = library.assignOrDefaults;
    const isAssign = type === "assign";
    return (scope: EvalScope) =>
      func(
        scope.runtimeState.$tracked,
        index,
        args[0](scope),
        isAssign,
        !!metaData.invalidates
      );
  };

  const keysOrValues = (
    type: string,
    args: Evaluator[],
    index: number,
    metaData: Partial<ProjectionMetaData>
  ) => {
    const func = library.valuesOrKeysForObject;
    const isValues = type === "values";
    return (scope: EvalScope) =>
      func(
        scope.runtimeState.$tracked,
        index,
        args[0](scope),
        isValues,
        !!metaData.invalidates
      );
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
    type: "call" | "effect",
    args: Evaluator[],
    index: number,
    metaData: Partial<ProjectionMetaData>
  ) => (evalScope: EvalScope) =>
    library.call(
      evalScope.runtimeState.$tracked,
      args.map(a => a(evalScope)),
      index,
      args.length,
      !!metaData.invalidates
    );

  const bind = (
    type: "bind",
    args: Evaluator[],
    index: number,
    md: Partial<ProjectionMetaData>
  ) => {
    const len = args.length;
    return (evalScope: EvalScope) =>
      library.bind(
        evalScope.runtimeState.$tracked,
        args.map(a => a(evalScope)),
        index,
        args.length,
        !!md.invalidates
      );
  };

  const simpleResolver = (func: (...args: any[]) => any) => (
    type: string,
    args: Evaluator[]
  ) => (scope: EvalScope) => func(...args.map(a => a(scope)));

  const wrapCond = (test: Evaluator, id: number, index: number, tracked: boolean) =>
    tracked
      ? (scope: EvalScope) => (scope.conds[id] = index) && test(scope)
      : test;

  const ternary = (
    name: "ternary",
    [test, then, alt]: Evaluator[],
    index: number,
    metaData: Partial<ProjectionMetaData>
  ) => {
    const tracked = !!metaData.tracked;
    const thenWrapped = wrapCond(then, metaData.id || -1, 2, tracked);
    const altWrapped = wrapCond(alt, metaData.id || -1, 3, tracked);
    return (scope: EvalScope) =>
      test(scope) ? thenWrapped(scope) : altWrapped(scope);
  };

  const or = (
    name: "or",
    args: Evaluator[],
    index: number,
    metaData: Partial<ProjectionMetaData>
  ) => {
    const tracked = !!metaData.tracked;
    const wrappedArgs = args.map((e, i) => wrapCond(e, metaData.id || -1, i + 1, tracked));
    return (scope: EvalScope) =>
      wrappedArgs.reduce(
        (current: any, next: Evaluator) => current || next(scope),
        false
      );
  };

  const and = (
    name: "and",
    args: Evaluator[],
    index: number,
    metaData: Partial<ProjectionMetaData>
  ) => {
    const tracked = !!metaData.tracked;
    const wrappedArgs = args.map((e, i) => wrapCond(e, metaData.id || -1, i + 1, tracked));
    return (scope: EvalScope) =>
      wrappedArgs.reduce(
        (current: any, next: Evaluator) => current && next(scope),
        true
      );
  };

  const array = (
    name: "array",
    args: Evaluator[],
    index: number,
    metaData: Partial<ProjectionMetaData>
  ) => (scope: EvalScope) =>
    library.array(
      scope.runtimeState.$tracked,
      args.map(a => a(scope)),
      index,
      args.length,
      !!metaData.invalidates
    );

  const object = (
    name: "object",
    args: Evaluator[],
    index: number,
    metaData: Partial<ProjectionMetaData>
  ) => {
    debugger;
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
        !!metaData.invalidates
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

  const cond = (name: 'cond', [getNum]: Evaluator[]) =>
    { return (scope: EvalScope) => scope.conds[getNum(scope)]; }

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

  const resolveSource = (projectionIndex: number) => {
      const src = sources[getters[projectionIndex][3]]
      return src ? `${primitives[src[0]]}:${src[1]}:${src[2]}` : ""
  }

  const mathResolver = (name: string, [getSrc]: Evaluator[], index: number) => {
    const func = debugMode
      ? library.mathFunction(name, resolveSource(index))
      : Math[name as "ceil" | "floor" | "round"];
    return (evalScope: EvalScope) => func(getSrc(evalScope));
  };

  const resolvers: Partial<{ [key in ProjectionType]: Resolver }> = {
    val: scopeResolver,
    key: scopeResolver,
    context,
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
    map: topLevelResolver,
    mapValues: topLevelResolver,
    any: topLevelResolver,
    anyValues: topLevelResolver,
    recursiveMap: topLevelResolver,
    recursiveMapValues: topLevelResolver,
    filter: topLevelResolver,
    filterBy: topLevelResolver,
    keyBy: topLevelResolver,
    groupBy: topLevelResolver,
    mapKeys: topLevelResolver,
    size: topLevelNonPredicate,
    sum: topLevelNonPredicate,
    flatten: topLevelNonPredicate,
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
    const [typeIndex, argRefs, getterMetadata] = getter;
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
      argRefs.map(arg => (isPrimitiveIndex(arg) ? {} : getMetaData(arg)))
    );
    return evaluator;
  };
  const evaluators: Evaluator[] = getters.map(buildEvaluator);
  const topLevelResults: ProjectionResult[] = [];

  const topLevelEvaluators = topLevels.map(
    ([projectionIndex]: [number, string], index: number) => {
      const evaluator = evaluators[projectionIndex];
      const md = getMetaData(projectionIndex);
      const pretracking = resolvePretracking(md);
      const tracking = resolveTracking(md);
      return (evalScope: EvalScope) => {
        evalScope = pretracking(evalScope);
        const result = evaluator(evalScope);
        tracking(evalScope);
        return result;
      };
    }
  );

  setters.forEach((s: SetterProjection) => {
    const [typeIndex, nameIndex, projections, numTokens] = s;
    const name = primitives[nameIndex];
    const type = primitives[typeIndex] as "push" | "splice" | "set";
    const path = projections.map(resolveArgRef);
    $res[name] = library.$setter.bind(null, (...args: any[]) =>
      library[type](
        path.map((arg: Evaluator) => arg({ args } as EvalScope)),
        ...args.slice(numTokens)
      )
    );
  });

  function step({ $first, $invalidatedRoots, $model }: StepParams) {
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
    };
    topLevelEvaluators.forEach((evaluator: Evaluator, i: number) => {
        const name = topLevels[i][1]
      if ($first || $invalidatedRoots.has(i)) {
        const result = evaluator({
          ...evalScope,
          runtimeState: {
            ...evalScope.runtimeState,
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
      }
    });
  }

  return {
    step
  };
}
