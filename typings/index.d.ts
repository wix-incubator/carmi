interface FunctionLibrary { [name: string]: (...args: any[]) => any }
interface Looper<T> { }
type AnyPrimitive = string | number | boolean

type UnionToIntersection<U> = 
    (U extends any ? (k: U)=>void : never) extends ((k: infer I)=>void) ? I : never

type Argument<T, F extends FunctionLibrary> = T | Graph<T, F>
type Clean<V> = {[key in keyof V]: V[key]}

interface GraphImpl<This, 
            F extends FunctionLibrary,
            Primitive = (This extends string ? string : This extends number ? number : This extends boolean ? boolean : never),
            PrimitiveArgument = Argument<AnyPrimitive, F>,
            Key = This extends object ? keyof This : never,
            IsNonObjectArray = (This extends any[] ? false : This extends object ? true : false),
            Value = This extends (infer V)[] ? V : This extends object ? This[keyof This] : never,
            ValueProjection = This extends object ? Graph<Value, F> : never,
            KeyProjection = This extends object ? Graph<Key, F> : never
            > {

    // Any
    call<FunctionName extends keyof F, Arguments>(func: FunctionName, ...args: Arguments[]): Graph<ReturnType<F[FunctionName]>, F>
    breakpoint(): this
    trace(logLevel?: 'log' | 'trace' | 'error' | 'warn'): this
    not(): Graph<boolean, F>
    ternary<Consequence, Alternate>(consequence: Argument<Consequence, F>, alternate: Argument<Alternate, F>): Consequence | Alternate
    eq(other: PrimitiveArgument): Graph<boolean, F>
    recur<ValueType>(loop: Looper<ValueType>): ValueType


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

    // String
    startsWith(s: Argument<string, F>): This extends string ? Graph<boolean, F> : never
    endsWith(s: Argument<string, F>): This extends string ? Graph<boolean, F> : never
    plus(num: Argument<string, F>): This extends string ? Graph<string, F> : never
    split(s: Argument<string, F>): This extends string ? Graph<string[], F> : never 
    toUpperCase(): This extends string ? Graph<string, F> : never
    toLowerCase(): This extends string ? Graph<string, F> : never
    parseInt(radix?: number): This extends string ? Graph<number, F> : never

    // Array/object
    size(): Graph<This extends any[] ? This['length'] : This extends object ? Graph<number, F> : never, F>,

    // Array
    get<K extends number>(key: Graph<K, F>|K): This extends any[] ? Graph<This[K], F> : never
    assign(): This extends any[] ? Graph<UnionToIntersection<Value>, F> : never
    head(): This extends any[] ? Graph<Value, F> : never
    last(): This extends any[] ? Graph<Value, F> : never
    sum(): This extends number[] ? Graph<number, F> : never
    join(separator: Argument<string, F>): This extends string[] ? Graph<string, F> : never
    reverse(): This extends any[] ? Graph<Value[], F> : never
    map<Scope, Ret>(functor: (value: ValueProjection, key?: KeyProjection, scope?: Scope) => Argument<Ret, F>, scope?: Scope) : This extends any[] ? Graph<Ret[], F> : never
    any<Scope>(functor: (value: ValueProjection, key?: KeyProjection, scope?: Scope) => Argument<boolean, F>, scope?: Scope) : This extends any[] ? Graph<boolean, F> : never
    keyBy<Scope, Ret extends Argument<string, F>>(functor: (value: Value, key?: Key, scope?: Scope) => Argument<Ret, F>, scope?: Scope) : This extends any[] ?
        Ret extends string ? {[name in Ret]: Value} : {[name: string]: Value} : never
    filter<Scope>(functor: (value: ValueProjection, key?: KeyProjection, scope?: Scope) => Argument<boolean, F>, scope?: Scope) : This extends any[] ? Graph<Value[], F> : never
    find<Scope>(functor: (value: ValueProjection, key?: KeyProjection, scope?: Scope) => Argument<boolean, F>, scope?: Scope) : This extends any[] ? Value : never
    findIndex<Scope>(functor: (value: ValueProjection, key?: KeyProjection, scope?: Scope) => Argument<boolean, F>, scope?: Scope) : This extends any[] ? Graph<number, F> : never
    reduce<Ret>(functor: (aggregate: Ret, value?: Value, key?: KeyProjection) => Argument<Ret, F>, initialValue?: Ret): This extends any[]? Ret : never
    append<T>(value: T) : This extends any[] ? Graph<(Value|T)[], F> : never
    concat<T>(...arrays: T[][]) : This extends any[] ? Graph<(Value|T)[], F> : never
    recursiveMap<Scope, Ret>(functor: (loop: Looper<Ret>, value?: Value, key?: Key, scope?: Scope) => Argument<Ret, F>, scope?: Scope): This extends any[] ? Graph<Ret[], F> : never
    includes(value: Value): This extends any[] ? Graph<boolean, F> : never

    // Object
    get<K extends string>(key: Graph<K, F>|K): IsNonObjectArray extends true ? K extends keyof This ? Graph<This[K], F> : never : never

    keys(): IsNonObjectArray extends true ? This extends any[] ? never : Graph<Key[], F> : never
    values(): IsNonObjectArray extends true ? This extends any[] ? never : Graph<Value[], F>: never
    has(key: Argument<string, F>): IsNonObjectArray extends true ? This extends any[] ? never : 
        typeof key extends string ? typeof key extends Key ? Graph<boolean, F> : Graph<false, F> :
        never: never
    includesValue(value: Value): IsNonObjectArray extends true ? Graph<boolean, F> : never
    filterBy<Scope>(functor: (value: ValueProjection, key?: KeyProjection, scope?: Scope) => Argument<boolean, F>, scope?: Scope) : IsNonObjectArray extends true ? this : never
    pick<K extends Key>(keys: K[]): Value extends object ? K extends keyof This ? Graph<{[key in K]: This[K]}, F> : never : never
    mapValues<Scope, Ret>(functor: (value: ValueProjection, key?: KeyProjection, scope?: Scope) => Argument<Ret, F>, scope?: Scope) : Key extends string ? Graph<{[name in Key]: Ret}, F> : never
    mapKeys<Scope, Ret extends Argument<string, F>>(functor: (value: Value, key?: Key, scope?: Scope) => Argument<Ret, F>, scope?: Scope) : 
    IsNonObjectArray extends true ? Graph<{[key in Ret extends string ? Ret : string]: Value}, F> : never
    anyValues<Scope>(functor: (value: ValueProjection, key?: KeyProjection, scope?: Scope) => Argument<boolean, F>, scope?: Scope) : IsNonObjectArray extends true ? Graph<boolean, F> : never
    groupBy<Scope, Ret>(functor: (value: ValueProjection, key?: KeyProjection, scope?: Scope) => Argument<Ret, F>, scope?: Scope) : Key extends string ?  {[key in Ret extends string ? Ret : string]: Value} : never
    assignIn<V extends object>(value: Argument<V, F>): IsNonObjectArray extends true ? Graph<This & V, F> : never
    setIn(path: string[]): this
    recursiveMapValues<Scope, Ret>(functor: (loop: Looper<Ret>, value?: Value, key?: Key, scope?: Scope) => Argument<Ret, F>, scope?: Scope): Key extends string ? Graph<{
        Key: Ret 
    }, F> : never
}

interface Expression { }
interface Token { $type: string }
type PathSegment = Token | string | number
type SetterExpression<Model, Path, F> = {}
type SpliceExpression<Model, Path, F> = {}

interface Graph<T, F extends FunctionLibrary> extends Clean<GraphImpl<T, F>>, Expression {}
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