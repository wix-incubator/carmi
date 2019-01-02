export interface FunctionLibrary { [name: string]: (...args: any[]) => any }
interface Looper<T> { }

type UnionToIntersection<U> = (U extends any ? (k: U)=>void : never) extends ((k: infer I)=>void) ? I : never

interface AbstractGraph {$isCarmiGraph: true}
interface GraphBase<NativeType> extends AbstractGraph {$value: NativeType}

type AsNative<T> = T extends GraphBase<infer N> ? N : T
type Argument<T> = AsNative<T> | GraphBase<T>
type AsNativeRecursive<T> = T extends object ? {[k in keyof T]: AsNative<T[k]>} : AsNative<T>
interface GraphImpl<NativeType, F extends FunctionLibrary> extends GraphBase<NativeType> {
    /**
     * Returns a graph that resolves to the return type of a named function from the function library
     * 
     * @param func A function name from the function library
     * @param args Args to pass, in addition to the value resolved from ""
     */
    call<FunctionName extends keyof F, Arguments>(func: FunctionName, ...args: Arguments[]): Graph<ReturnType<F[FunctionName]>, F>
    effect<FunctionName extends keyof F, Arguments>(func: FunctionName, ...args: Arguments[]): Graph<ReturnType<F[FunctionName]>, F>


    bind<FunctionName extends keyof F, BoundArgs, Args>(func: FunctionName, ...boundArgs: BoundArgs[]): (...args: Args[]) => ReturnType<F[FunctionName]>

    /**
     * Generates a breakpoint (debugger clause), continuing the graph
     */
    breakpoint(): this

    /**
     * Generates a console statement, continuing the chain.
     * @param logLevel
     */
    trace(logLevel?: 'log' | 'trace' | 'error' | 'warn'): this

    /**
     * Resolves to !NativeType
     */
    not(): BoolGraph<F>

    /**
     * Resolves to either consequence or alternate, based on the value of NativeType.
     * Note that both options will be evaluated, even if one of them is not semantically possible.
     * 
     * @param consequence graph if NativeType value is truthy
     * @param alternate graph is NativeType value is falsey
     */
    ternary<Consequence, Alternate>(consequence: Argument<Consequence>, alternate: Argument<Alternate>): Graph<Consequence | Alternate, F>

    /**
     * Returns a boolean graph that resolves to the value of (NativeType === other) 
     * @param other 
     */
    eq(other: Argument<unknown>): BoolGraph<F>

    /**
     * When run on a key inside a recursiveMap/recursiveMapValues functor,
     * will return the resolved value for a given key. NativeType allows returning values for indicies of a map based on other values.
     * @param loop passed to the functor of recursiveMap/recursiveMapValues
     */
    recur<ValueType>(loop: Looper<ValueType>): ValueType
}

export interface NumberGraph<NativeType extends number, F extends FunctionLibrary> extends GraphImpl<NativeType, F> {
    /**
     * Resolves to (NativeType > other)
     * @param other 
     */
    gt(other: Argument<number>): BoolGraph<F>
 
    /**
     * Resolves to (NativeType >= other)
     * @param other 
     */
    gte(other: Argument<number>): BoolGraph<F>

   /**
     * Resolves to (NativeType < other)
     * @param other 
     */
    lt(other: Argument<number>): BoolGraph<F>

   /**
     * Resolves to (NativeType <= other)
     * @param other 
     */
    lte(other: Argument<number>): BoolGraph<F>

   /**
     * Resolves to (NativeType - other)
     * @param other 
     */
    minus(value: Argument<number>): NumberGraph<number, F>

   /**
     * Resolves to (NativeType * other)
     * @param other 
     */
    mult(value: Argument<number>): NumberGraph<number, F>

   /**
     * Resolves to (NativeType + other)
     * @param other 
     */
    plus(num: Argument<number>): NumberGraph<number, F>
    plus(str: Argument<string>): StringGraph<string, F>

   /**
     * Resolves to (NativeType / other)
     * @param other 
     */
    div(value: Argument<number>): NumberGraph<number, F>

   /**
     * Resolves to (NativeType % other)
     * @param other 
     */
    mod(value: Argument<number>): NumberGraph<number, F>

    /**
     * @returns a number array graph, with size equal to resolved "NativeType"
     * @param start number to start from
     * @param skip number to skip between values
     */
    range(start?: Argument<number>, skip?: Argument<number>): NumberGraph<number, F>[]

    /**
     * Resolves to Math.floor(NativeType)
     */
    floor(): NumberGraph<number, F>

    /**
     * Resolves to Math.ceil(NativeType)
     */
    ceil(): NumberGraph<number, F>

    /**
     * Resolves to Math.round(NativeType)
     */
    round(): NumberGraph<number, F>
}

export interface BoolGraph<F extends FunctionLibrary> extends GraphImpl<boolean, F> {}

interface StringGraph<NativeType extends string, F extends FunctionLibrary> extends GraphImpl<NativeType, F> {
    /**
     * Resolves to (NativeType.startsWith(s))
     * @param s other string
     */
    startsWith(s: Argument<string>): BoolGraph<F>

    /**
     * Resolves to (NativeType.endsWith(s))
     * @param s other string
     */
    endsWith(s: Argument<string>): BoolGraph<F>

    /**
     * Resolves to (NativeType + s)
     * @param other other string
     */
    plus(other: Argument<string|number>): StringGraph<string, F>

    /**
     * Resolves to an array graph, like NativeType.split(separator)
     * @param separator
     */
    split(separator: Argument<string>): ArrayGraph<string[], F>

    /**
     * Resolves to NativeType.toUpperCase()
     */
    toUpperCase(): StringGraph<string, F>

    /**
     * Resolves to NativeType.toLowerCase()
     */
    toLowerCase(): StringGraph<string, F>

    /**
     * Resolves to parseInt(NativeType, radix)
     * @param radix base (10, 16 etc)
     */
    parseInt(radix?: number): NumberGraph<number, F>
}

interface ArrayOrObjectGraphImpl<NativeType extends any[]|object, F extends FunctionLibrary, Key = keyof NativeType>
    extends GraphImpl<NativeType, F> {

    get<K extends keyof NativeType>(key: K|AbstractGraph): K extends AbstractGraph ? Graph<NativeType[keyof NativeType], F> : Graph<NativeType[K], F>

    /**
     * Resolves to the deep value provided by path.
     * @param path 
     */
    getIn<K extends keyof NativeType>(path: [K]): Graph<NativeType[K], F>
    getIn<K0 extends keyof NativeType, K1 extends keyof NativeType[K0]>(path: [K0, K1]): Graph<NativeType[K0][K1], F>
    getIn<K0 extends keyof NativeType, K1 extends keyof NativeType[K0], K2 extends keyof NativeType[K0][K1]>(path: [K0, K1, K2]): Graph<NativeType[K0][K1][K2], F>
    getIn<K0 extends keyof NativeType, K1 extends keyof NativeType[K0], K2 extends keyof NativeType[K0][K1], K3 extends keyof NativeType[K0][K1][K2]>(path: [K0, K1, K2, K3]):
        Graph<NativeType[K0][K1][K2][K3], F>
    getIn<K0 extends keyof NativeType, K1 extends keyof NativeType[K0], K2 extends keyof NativeType[K0][K1], K3 extends keyof NativeType[K0][K1][K2], K4 extends keyof NativeType[K0][K1][K2][K3]>(path: [K0, K1, K2, K3]):
        Graph<NativeType[K0][K1][K2][K3][K4], F>

}

interface ArrayGraphImpl<NativeType extends any[], F extends FunctionLibrary,
    Value = NativeType extends (infer V)[] ? AsNative<V> : never,
    Key = keyof NativeType,
    ValueGraph = Graph<Value, F>,
    KeyGraph = NumberGraph<number, F>> extends ArrayOrObjectGraphImpl<Value[], F> {

    /**
     * Resolves to NativeType.length
     */
    size(): NumberGraph<NativeType['length'], F>

    /**
     * Combines all array values of the object. Like: _.reduce(NativeType, _.assign, {})
     */
    assign<T = NativeType extends object ? true : never>(): ObjectGraph<UnionToIntersection<Value>, F>

    /**
     * Combines all array values of the object, in reverse order. Like: _.reduce(NativeType, _.defaults, {})
     */
    defaults<T = NativeType extends object ? true : never>(): ObjectGraph<UnionToIntersection<Value>, F>

    /**
     * Resolves to the first item in an array
     */
    head(): ValueGraph

    /**
     * Resolves to the last item in an array
     */
    last(): ValueGraph

    /**
     * Resolves to the sum of numbers in a number array
     */
    sum(): Value extends number ? NumberGraph<number, F> : never

    /**
     * Joins an array of strings to a single strings, like NativeType.join(separator)
     * @param separator 
     */
    join(separator: Argument<string>): Value extends string ? StringGraph<string, F> : never

    reverse(): ArrayGraph<Value[], F>

    /**
     * Runs the functor for every item in an array. Returns a graph that resolves to an array with the returned values.
     * 
     * @param functor A function to run for every item of the array
     * @param scope A variable to pass to the functor if inside another functor.
     */
    map<Scope, Ret>(functor: (value: ValueGraph, key?: KeyGraph, scope?: Scope) => Argument<Ret>, scope?: Scope) : ArrayGraph<Ret[], F>

    /**
     * Returns a boolean graph that resolves to true if running the functor on any of the array's item resolved to true
     * 
     * @param functor A function to run for every item of the array, returning boolean
     * @param scope A variable to pass to the functor if inside another functor.
     */
    any<Scope>(functor: (value: ValueGraph, key?: KeyGraph, scope?: Scope) => Argument<boolean>, scope?: Scope) : BoolGraph<F>

    /**
     * Returns an object graph that resolves to an object containing keys returned by functor, pointing to their corresponding values.
     * 
     * @param functor A function to run for every item of the array, returning a string as a new key
     * @param scope A variable to pass to the functor if inside another functor.
     */
    keyBy<Scope, Ret extends Argument<string>>(functor: (value: ValueGraph, key?: KeyGraph, scope?: Scope) => Argument<Ret>, scope?: Scope) :
        ObjectGraph<Ret extends string ? {[name in Ret]: Value} : {[name: string]: Value}, F>

    /**
     * Returns an array graph containing only the values for which the functor resolved to true
     * 
     * @param functor A function to run for every item of the array, returning a boolean
     * @param scope A variable to pass to the functor if inside another functor.
     */
    filter<Scope>(functor: (value: ValueGraph, key?: KeyGraph, scope?: Scope) => any, scope?: Scope) : ArrayGraph<Value[], F>

    /**
     * Resolved to the first value for which the functor resolved to true
     * 
     * @param functor A function to run for every item of the array, returning a boolean
     * @param scope A variable to pass to the functor if inside another functor.
     */
    find<Scope>(functor: (value: ValueGraph, key?: KeyGraph, scope?: Scope) => Argument<boolean>, scope?: Scope) : ValueGraph

    /**
     * Resolved to the index of the first value for which the functor resolved to true, or -1 if not found.
     * 
     * @param functor A function to run for every item of the array, returning a boolean
     * @param scope A variable to pass to the functor if inside another functor.
     */
    findIndex<Scope>(functor: (value: ValueGraph, key?: KeyGraph, scope?: Scope) => Argument<boolean>, scope?: Scope) : KeyGraph

    /**
     * Returns a value that is a result of running functor on all the items of the array in order, each time with the previous result of functor.
     * 
     * @param functor A function to run for every item of the array, with the previous value as aggregate
     * @param initialValue The aggregate to pass to the first argument.
     */
    reduce<Ret>(functor: (aggregate: Argument<Ret>, value?: ValueGraph, key?: KeyGraph) => Argument<Ret>, initialValue?: Ret): NativeType extends any[] ? Ret : never

    /**
     * Returns an array with an additional element (value) at its end
     * 
     * @param value A value to add to the array, or a graph resolving to that value
     */
    append<T>(value: Argument<T>) : ArrayGraph<(Value|T)[], F>

    /**
     * Resolves to an array which is a concatenated results of NativeType and one or more additional arrays
     * @param arrays 
     */
    concat<T>(...arrays: Argument<T[]>[]) : ArrayGraph<(Value|T)[], F>

    /**
     * Resolves to true if the array contains an argument equal to value
     * @param value 
     */
    includes(value: Argument<Value>): BoolGraph<F>

    /**
     * Resolves to an array with size identical to NativeType, with each element resolving to the result of functor on the equivalent element in NativeType.
     * The functor is given a "loop" parameter, which can be used to retrieve the functor's result on a different key. For example:
     * 
     * // Will resolve to [1, 2, 4, 8, ...]
     * recursiveMap((loop, value, key) => key.eq(0).ternary(1, key.minus(1).recur(loop).multiply(2)))
     * 
     * @param functor 
     * @param scope 
     */

    recursiveMap<Scope, Ret>(functor: (loop: Looper<Ret>, value?: Value, key?: Key, scope?: Scope) => Argument<Ret>, scope?: Scope): ArrayGraph<Ret[], F>
}

interface ObjectGraphImpl<NativeType extends object, F extends FunctionLibrary,
    Key = keyof NativeType,
    Value = AsNative<NativeType[keyof NativeType]>,
    ValueGraph = Graph<Value, F>,
    KeyGraph = Graph<keyof NativeType, F>> extends ArrayOrObjectGraphImpl<{[key in keyof NativeType]: AsNative<NativeType[key]>}, F> {

    /**
     * Resolves to the number of keys in the object
     */
    size(): NumberGraph<number, F>

    /**
     * Resolves to an array representing the keys of the object
     */
    keys(): ArrayGraph<Key[], F>

    /**
     * Resolves to an array representing the values of the object
     */
    values(): ArrayGraph<Value[], F>

    /**
     * Resolves to true if NativeType has the given key as a key
     * @param key A potential key of NativeType
     */
    has(key: Argument<string>): BoolGraph<F>

    /**
     * Resolve to true if NativeType object has a value equal to the value argument
     * @param value 
     */
    includesValue(value: Argument<Value>): BoolGraph<F>

    /**
     * Resolves to a new object with the entries for which the functor has resolved to true
     * 
     * @param functor 
     * @param scope 
     */
    filterBy<Scope>(functor: (value: ValueGraph, key?: KeyGraph, scope?: Scope) => any, scope?: Scope) : this

    /**
     * Resolves to a new object with only the keys passed as argument
     * 
     * @param functor 
     * @param scope 
     */
    pick<K extends keyof NativeType>(keys: Argument<K[]>): this

    /**
     * Resolves to an object with the same keys, with each value resolves to the return value of functor on the corresponding entry.
     * 
     * @param functor 
     * @param scope 
     */
    mapValues<Scope, Ret>(functor: (value: ValueGraph, key?: KeyGraph, scope?: Scope) => Ret, scope?: Scope) : 
        ObjectGraph<{[name in keyof NativeType]: AsNativeRecursive<Ret>}, F>

    /**
     * Resolves to an object with the same values, with each key resolves to the return value of functor on the corresponding entry.
     * 
     * @param functor 
     * @param scope 
     */
    mapKeys<Scope, Ret>(functor: (value: ValueGraph, key?: StringGraph<string, F>, scope?: Scope) => Ret, scope?: Scope) : ObjectGraph<{[key in Ret extends string ? Ret : string]: Value}, F>

    /**
     * Resolves to a boolean representing whether the object contains any value for which the functor has resolved to true
     * 
     * @param functor 
     * @param scope 
     */
    anyValues<Scope>(functor: (value: ValueGraph, key?: KeyGraph, scope?: Scope) => Argument<boolean>, scope?: Scope) : BoolGraph<F>

    /**
     * Returns a new object with the keys returned by the functor, and the values resolves to arrays with all the elements which returned that key
     */
    groupBy<Scope, Ret>(functor: (value: ValueGraph, key?: KeyGraph, scope?: Scope) => Argument<Ret>, scope?: Scope) : ObjectGraph<{[key: string]: Value[]}, F>

    /**
     * Returns a new object which resolves to _.assign(NativeType, value)
     * @param value 
     */
    assignIn<V extends object>(value: Argument<V>[]): ObjectGraph<NativeType & AsNative<V>, F>

    setIn(path: string[]): ObjectGraph<NativeType, F>

    /**
     * Resolves to an object with keys identical to NativeType, with each element resolving to the result of functor on the equivalent element in NativeType.
     * The functor is given a "loop" parameter, which can be used to retrieve the functor's result on a different key. For example:
     * 
     * @param functor 
     * @param scope 
     */
    recursiveMapValues<Scope, Ret>(functor: (loop: Looper<Ret>, value?: Value, key?: Key, scope?: Scope) => Argument<Ret>, scope?: Scope): ObjectGraph<{
        Key: Ret 
    }, F>
}

interface Expression { }
interface Token { $type: string }
type PathSegment = Token | string | number
type SetterExpression<Model, Path, F> = {}
type SpliceExpression<Model, Path, F> = {}

export interface ArrayGraph<T extends any[], F extends FunctionLibrary> extends ArrayGraphImpl<T, F> {}
export interface ObjectGraph<T extends object, F extends FunctionLibrary> extends ObjectGraphImpl<AsNative<T>, F> {}


export type Graph<N, F extends FunctionLibrary> = 
    N extends AbstractGraph ? N :
    N extends string ? StringGraph<N, F> :
    N extends number ? NumberGraph<N, F> :
    N extends boolean ? BoolGraph<F> :
    N extends any[] ? ArrayGraph<N, F> :
    N extends object ? ObjectGraph<N, F> :
    never

export interface CarmiAPI<Schema = unknown, F extends FunctionLibrary = {}> {
    root: Graph<Schema, F>
    chain<T>(t: T): Graph<T, F>
    or<A, B>(a: A, b: B): Graph<A, F> | Graph<B, F>
    or<A, B, C>(a: A, b: B, c: C): Graph<A, F> | Graph<B, F> | Graph<C, F>
    or<A, B, C, D>(a: A, b: B, c: C, d: D): Graph<A, F> | Graph<B, F> | Graph<C, F> | Graph<D, F>
    or<A, B, C, D, E>(a: A, b: B, c: C, d: D, e: E): Graph<A, F> | Graph<B, F> | Graph<C, F> | Graph<D, F> | Graph<E, F>
    or<A, B, C, D, E, FF>(a: A, b: B, c: C, d: D, e: E, f: FF): Graph<A, F> | Graph<B, F> | Graph<C, F> | Graph<D, F> | Graph<E, F> | Graph<FF, F>
    and<A, B>(a: A, b: B): Graph<B, F>
    and<A, B, C>(a: A, b: B, c: C): Graph<C, F>
    and<A, B, C, D>(a: A, b: B, c: C, d: D): Graph<D, F>
    setter<Path extends PathSegment[]>(...path: Path): SetterExpression<Schema, Path, F>
    splice<Path extends PathSegment[]>(...path: Path): SpliceExpression<Schema, Path, F>
    call<FunctionName extends keyof F, Args>(func: FunctionName, ...args: Args[]): Graph<ReturnType<F[FunctionName]>, F>
    effect<FunctionName extends keyof F, Args>(func: FunctionName, ...args: Args[]): Graph<ReturnType<F[FunctionName]>, F>
    bind<FunctionName extends keyof F>(func: FunctionName, ...boundArgs: any[]): (...args: any[]) => ReturnType<F[FunctionName]>
    compile(transformations: object, options?: object): string
    withSchema<Schema, F extends FunctionLibrary = {}>(model?: Schema, functions?: F): CarmiAPI<Schema, F>
    abstract(name: string): Graph<unknown, F>
    implement(iface: Graph<unknown, F>, name: string): void
    withName<T>(name: string, g: T): T
    arg0: Token
    arg1: Token
    arg2: Token
}

declare const carmiDefaultAPI : CarmiAPI
export function chain<T>(t: T): Graph<T, any>
export function or<Args>(...a: Argument<Args>[]): Args | BoolGraph<any>
export function and<Args>(...a: Argument<Args>[]): Args | BoolGraph<any>
export function setter<Path extends PathSegment[]>(...path: Path): SetterExpression<any, Path, any>
export function splice<Path extends PathSegment[]>(...path: Path): SetterExpression<any, Path, any>
export function withSchema<Schema, F extends FunctionLibrary = {}>(model?: Schema, functions?: F): CarmiAPI<Schema, F>
export function withName<T>(name: string, g: T): T

export default carmiDefaultAPI