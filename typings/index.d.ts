interface FunctionLibrary { [name: string]: (...args: any[]) => any }
interface Looper<T> { }
type AnyPrimitive = string | number | boolean

type UnionToIntersection<U> = 
    (U extends any ? (k: U)=>void : never) extends ((k: infer I)=>void) ? I : never

type Argument<T, F extends FunctionLibrary> = T | Graph<T, F>
type AsGraph<T, F extends FunctionLibrary> = T extends Graph<infer Native, F> ? T : Graph<T, F>
interface GraphImpl<This, 
            F extends FunctionLibrary,
            Primitive = (This extends string ? string : This extends number ? number : This extends boolean ? boolean : never),
            PrimitiveArgument = Argument<AnyPrimitive, F>,
            Key = This extends object ? keyof This : never,
            IsNonObjectArray = (This extends any[] ? false : This extends object ? true : false),
            Value = This extends (infer V)[] ? V : This extends object ? This[keyof This] : never,
            ValueGraph = This extends object ? Graph<Value, F> : never,
            KeyGraph = This extends object ? Graph<Key, F> : never
            > {

    // Any
    call<FunctionName extends keyof F, Arguments>(func: FunctionName, ...args: Arguments[]): Graph<ReturnType<F[FunctionName]>, F>
    breakpoint(): Graph<This, F>
    trace(logLevel?: 'log' | 'trace' | 'error' | 'warn'): Graph<This, F>
    not(): Graph<boolean, F>
    ternary<Consequence, Alternate>(consequence: Argument<Consequence, F>, alternate: Argument<Alternate, F>): AsGraph<Consequence | Alternate, F>
    eq(other: PrimitiveArgument): Graph<boolean, F>
    recur<ValueType>(loop: Looper<ValueType>): ValueType
}

interface NumberGraphImpl<This extends number, F extends FunctionLibrary> extends GraphImpl<This, F> {
    // Number
    gt(other: Argument<number, F>): This extends number ? Graph<boolean, F> : never
    gte(other: Argument<number, F>): This extends number ? Graph<boolean, F> : never
    lt(other: Argument<number, F>): This extends number ? Graph<boolean, F> : never
    lte(other: Argument<number, F>): This extends number ? Graph<boolean, F> : never
    minus(value: Argument<number, F>): This extends number ? Graph<number, F> : never
    mult(value: Argument<number, F>): This extends number ? Graph<number, F> : never
    plus(num: Argument<number, F>): This extends number ? Graph<number, F> : never
    plus(str: Argument<string, F>): This extends number ? Graph<number, F> : never
    div(value: Argument<number, F>): This extends number ? Graph<number, F> : never
    mod(value: Argument<number, F>): This extends number ? Graph<number, F> : never
    range(start?: Argument<number, F>, skip?: Argument<number, F>): Graph<number[], F>
    floor(): This extends number ? Graph<number, F> : never
    ceil(): This extends number ? Graph<number, F> : never
    round(): This extends number ? Graph<number, F> : never
}

interface BooleanGraphImpl<This extends boolean, F extends FunctionLibrary> extends GraphImpl<This, F> {}

interface StringGraphImpl<This extends string, F extends FunctionLibrary> extends GraphImpl<This, F> {
    startsWith(s: Argument<string, F>): This extends string ? Graph<boolean, F> : never
    endsWith(s: Argument<string, F>): This extends string ? Graph<boolean, F> : never
    plus(num: Argument<string, F>): This extends string ? Graph<string, F> : never
    split(s: Argument<string, F>): This extends string ? Graph<string[], F> : never 
    toUpperCase(): This extends string ? Graph<string, F> : never
    toLowerCase(): This extends string ? Graph<string, F> : never
    parseInt(radix?: number): This extends string ? Graph<number, F> : never
}

interface ArrayOrObjectGraphImpl<This extends any[]|object, F extends FunctionLibrary, Key = keyof This> {
    get<K extends keyof This>(key: Argument<K, F>): Graph<K extends GraphImpl<infer T, F> ? This[keyof This] : K extends keyof This ? This[K] : never, F>

    getIn<K extends keyof This>(path: [K]): Graph<This[K], F>
    getIn<K0 extends keyof This, K1 extends keyof This[K0]>(path: [K0, K1]): Graph<This[K0][K1], F>
    getIn<K0 extends keyof This, K1 extends keyof This[K0], K2 extends keyof This[K0][K1]>(path: [K0, K1, K2]): Graph<This[K0][K1][K2], F>
    getIn<K0 extends keyof This, K1 extends keyof This[K0], K2 extends keyof This[K0][K1], K3 extends keyof This[K0][K1][K2]>(path: [K0, K1, K2, K3]):
        Graph<This[K0][K1][K2][K3], F>
    getIn<K0 extends keyof This, K1 extends keyof This[K0], K2 extends keyof This[K0][K1], K3 extends keyof This[K0][K1][K2], K4 extends keyof This[K0][K1][K2][K3]>(path: [K0, K1, K2, K3]):
        Graph<This[K0][K1][K2][K3][K4], F>
}

interface ArrayGraphImpl<This extends any[], F extends FunctionLibrary,
    Value = This extends (infer V)[] ? V : never,
    Key = keyof This,
    ValueGraph = Graph<Value, F>,
    KeyGraph = Graph<keyof This, F>> extends ArrayOrObjectGraphImpl<This, F> {
    size(): Graph<This['length'], F>

    assign(): Graph<UnionToIntersection<Value>, F>
    head(): Graph<Value, F>
    last(): Graph<Value, F>
    sum(): Value extends number ? Graph<number, F> : never
    join(separator: Argument<string, F>): Value extends string ? Graph<string, F> : never
    reverse(): Graph<Value[], F>
    map<Scope, Ret>(functor: (value: ValueGraph, key?: KeyGraph, scope?: Scope) => Argument<Ret, F>, scope?: Scope) : Graph<Ret[], F>
    any<Scope>(functor: (value: ValueGraph, key?: KeyGraph, scope?: Scope) => Argument<boolean, F>, scope?: Scope) : Graph<boolean, F>
    keyBy<Scope, Ret extends Argument<string, F>>(functor: (value: Value, key?: Key, scope?: Scope) => Argument<Ret, F>, scope?: Scope) :
        Ret extends string ? {[name in Ret]: Value} : {[name: string]: Value}
    filter<Scope>(functor: (value: ValueGraph, key?: KeyGraph, scope?: Scope) => Argument<boolean, F>, scope?: Scope) : Graph<Value[], F>
    find<Scope>(functor: (value: ValueGraph, key?: KeyGraph, scope?: Scope) => Argument<boolean, F>, scope?: Scope) : ValueGraph
    findIndex<Scope>(functor: (value: ValueGraph, key?: KeyGraph, scope?: Scope) => Argument<boolean, F>, scope?: Scope) : KeyGraph
    reduce<Ret>(functor: (aggregate: Ret, value?: ValueGraph, key?: KeyGraph) => Argument<Ret, F>, initialValue?: Ret): This extends any[]? Ret : never
    append<T>(value: T) : This extends any[] ? Graph<(Value|T)[], F> : never
    concat<T>(...arrays: T[][]) : Graph<(Value|T)[], F>
    recursiveMap<Scope, Ret>(functor: (loop: Looper<Ret>, value?: Value, key?: Key, scope?: Scope) => Argument<Ret, F>, scope?: Scope): Graph<Ret[], F>
    includes(value: Value): Graph<boolean, F>
}

interface ObjectGraphImpl<This extends object, F extends FunctionLibrary, Key = keyof This, Value = This[keyof This],
    ValueGraph = Graph<Value, F>,
    KeyGraph = Graph<keyof This, F>> extends ArrayOrObjectGraphImpl<This, F> {

    keys(): Graph<Key[], F>
    values(): Graph<Value[], F>
    has(key: Argument<string, F>): Graph<boolean, F>
    includesValue(value: Value): Graph<boolean, F>
    filterBy<Scope>(functor: (value: ValueGraph, key?: KeyGraph, scope?: Scope) => Argument<boolean, F>, scope?: Scope) : Graph<This, F>
    pick<K extends Key>(keys: K[]): Value extends object ? K extends keyof This ? Graph<{[key in K]: This[K]}, F> : never : never
    mapValues<Scope, Ret>(functor: (value: ValueGraph, key?: KeyGraph, scope?: Scope) => Argument<Ret, F>, scope?: Scope) : Key extends string ? Graph<{[name in Key]: Ret}, F> : never
    mapKeys<Scope, Ret extends Argument<string, F>>(functor: (value: Value, key?: Key, scope?: Scope) => Argument<Ret, F>, scope?: Scope) : 
        Graph<{[key in Ret extends string ? Ret : string]: Value}, F>
    anyValues<Scope>(functor: (value: ValueGraph, key?: KeyGraph, scope?: Scope) => Argument<boolean, F>, scope?: Scope) : Graph<boolean, F>
    groupBy<Scope, Ret>(functor: (value: ValueGraph, key?: KeyGraph, scope?: Scope) => Argument<Ret, F>, scope?: Scope) : Key extends string ?  {[key in Ret extends string ? Ret : string]: Value} : never
    assignIn<V extends object>(value: Argument<V, F>): Graph<This & V, F>
    setIn(path: string[]): Graph<This, F>
    recursiveMapValues<Scope, Ret>(functor: (loop: Looper<Ret>, value?: Value, key?: Key, scope?: Scope) => Argument<Ret, F>, scope?: Scope): Graph<{
        Key: Ret 
    }, F>
}

interface Expression { }
interface Token { $type: string }
type PathSegment = Token | string | number
type SetterExpression<Model, Path, F> = {}
type SpliceExpression<Model, Path, F> = {}

interface StringGraph<T extends string, F extends FunctionLibrary> extends StringGraphImpl<T, F> {}
interface NumberGraph<T extends number, F extends FunctionLibrary> extends NumberGraphImpl<T, F> {}
interface BooleanGraph<T extends boolean, F extends FunctionLibrary> extends BooleanGraphImpl<T, F> {}
interface ArrayGraph<T extends any[], F extends FunctionLibrary> extends ArrayGraphImpl<T, F> {}
interface ObjectGraph<T extends object, F extends FunctionLibrary> extends ObjectGraphImpl<T, F> {}

type Graph<T, F extends FunctionLibrary> = 
    T extends string ? StringGraph<T, F> :
    T extends number ? NumberGraph<T, F> :
    T extends any[] ? ArrayGraph<T, F> :
    T extends object ? ObjectGraph<T, F> :
    T extends boolean ? BooleanGraph<T, F> :
    never


interface API<Schema = any, F extends FunctionLibrary = any> {
    root: Graph<Schema, F>
    chain<T>(t: T): Graph<T, F>
    and<Args>(...a: Args[]): Args
    or<Args>(...a: Args[]): Args
    setter<Path extends PathSegment[]>(...path: Path): SetterExpression<Schema, Path, F>
    splice<Path extends PathSegment[]>(...path: Path): SpliceExpression<Schema, Path, F>
    call<FunctionName extends keyof F, Args>(func: FunctionName, ...args: Args[]): Graph<ReturnType<F[FunctionName]>, F>
    bind<FunctionName extends keyof F, BoundArgs, Args>(func: FunctionName, ...boundArgs: BoundArgs[]): (...args: Args[]) => ReturnType<F[FunctionName]>
    compile(transformations: object, options?: object): string
    withSchema<Schema, F extends FunctionLibrary = {}>(model?: Schema, functions?: F): API<Schema, F>
    arg0: Token
    arg1: Token
    arg2: Token
}

declare const DefaultAPI : API
declare module 'carmi' { export = DefaultAPI }
export = DefaultAPI