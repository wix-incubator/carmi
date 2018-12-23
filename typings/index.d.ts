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

    /**
     * Returns a graph that resolves to the return type of a named function from the function library
     * 
     * @param func A function name from the function library
     * @param args Args to pass, in addition to the value resolved from "this"
     */
    call<FunctionName extends keyof F, Arguments>(func: FunctionName, ...args: Arguments[]): Graph<ReturnType<F[FunctionName]>, F>
    effect<FunctionName extends keyof F, Arguments>(func: FunctionName, ...args: Arguments[]): Graph<ReturnType<F[FunctionName]>, F>

    /**
     * Generates a breakpoint (debugger clause), continuing the graph
     */
    breakpoint(): Graph<This, F>

    /**
     * Generates a console statement, continuing the chain.
     * @param logLevel
     */
    trace(logLevel?: 'log' | 'trace' | 'error' | 'warn'): Graph<This, F>

    /**
     * Resolves to !this
     */
    not(): Graph<boolean, F>

    /**
     * Resolves to either consequence or alternate, based on the value of this.
     * Note that both options will be evaluated, even if one of them is not semantically possible.
     * 
     * @param consequence graph if this value is truthy
     * @param alternate graph is this value is falsey
     */
    ternary<Consequence, Alternate>(consequence: Argument<Consequence, F>, alternate: Argument<Alternate, F>): AsGraph<Consequence | Alternate, F>

    /**
     * Returns a boolean graph that resolves to the value of (this === other) 
     * @param other 
     */
    eq(other: PrimitiveArgument): Graph<boolean, F>

    /**
     * When run on a key inside a recursiveMap/recursiveMapValues functor,
     * will return the resolved value for a given key. This allows returning values for indicies of a map based on other values.
     * @param loop passed to the functor of recursiveMap/recursiveMapValues
     */
    recur<ValueType>(loop: Looper<ValueType>): ValueType
}

interface NumberGraphImpl<This extends number, F extends FunctionLibrary> extends GraphImpl<This, F> {
    /**
     * Resolves to (this > other)
     * @param other 
     */
    gt(other: Argument<number, F>): Graph<boolean, F>
 
    /**
     * Resolves to (this >= other)
     * @param other 
     */
    gte(other: Argument<number, F>): Graph<boolean, F>

   /**
     * Resolves to (this < other)
     * @param other 
     */
    lt(other: Argument<number, F>): Graph<boolean, F>

   /**
     * Resolves to (this <= other)
     * @param other 
     */
    lte(other: Argument<number, F>): Graph<boolean, F>

   /**
     * Resolves to (this - other)
     * @param other 
     */
    minus(value: Argument<number, F>): Graph<number, F>

   /**
     * Resolves to (this * other)
     * @param other 
     */
    mult(value: Argument<number, F>): Graph<number, F>

   /**
     * Resolves to (this + other)
     * @param other 
     */
    plus(num: Argument<number, F>): Graph<number, F>
    plus(str: Argument<string, F>): Graph<string, F>

   /**
     * Resolves to (this / other)
     * @param other 
     */
    div(value: Argument<number, F>): Graph<number, F>

   /**
     * Resolves to (this % other)
     * @param other 
     */
    mod(value: Argument<number, F>): Graph<number, F>

    /**
     * @returns a number array graph, with size equal to resolved "this"
     * @param start number to start from
     * @param skip number to skip between values
     */
    range(start?: Argument<number, F>, skip?: Argument<number, F>): Graph<number[], F>

    /**
     * Resolves to Math.floor(this)
     */
    floor(): Graph<number, F>

    /**
     * Resolves to Math.ceil(this)
     */
    ceil(): Graph<number, F>

    /**
     * Resolves to Math.round(this)
     */
    round(): Graph<number, F>
}

interface BooleanGraphImpl<This extends boolean, F extends FunctionLibrary> extends GraphImpl<This, F> {}

interface StringGraphImpl<This extends string, F extends FunctionLibrary> extends GraphImpl<This, F> {
    /**
     * Resolves to (this.startsWith(s))
     * @param s other string
     */
    startsWith(s: Argument<string, F>): Graph<boolean, F>

    /**
     * Resolves to (this.endsWith(s))
     * @param s other string
     */
    endsWith(s: Argument<string, F>): Graph<boolean, F>

    /**
     * Resolves to (this + s)
     * @param other other string
     */
    plus(other: Argument<string|number, F>): Graph<string, F>

    /**
     * Resolves to an array graph, like this.split(separator)
     * @param separator
     */
    split(separator: Argument<string, F>): Graph<string[], F> 

    /**
     * Resolves to this.toUpperCase()
     */
    toUpperCase(): Graph<string, F>

    /**
     * Resolves to this.toLowerCase()
     */
    toLowerCase(): Graph<string, F>

    /**
     * Resolves to parseInt(this, radix)
     * @param radix base (10, 16 etc)
     */
    parseInt(radix?: number): Graph<number, F>
}

interface ArrayOrObjectGraphImpl<This extends any[]|object, F extends FunctionLibrary, Key = keyof This> extends GraphImpl<This, F> {
    /**
     * Resolves to the value of this[key]
     * @param key A known key in the object/array, or a graph that resolves to a known key
     */
    get<K extends keyof This>(key: Argument<K, F>): Graph<K extends GraphImpl<infer T, F> ? This[keyof This] : K extends keyof This ? This[K] : never, F>

    /**
     * Resolves to the deep value provided by path.
     * @param path 
     */
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

    /**
     * Resolves to this.length
     */
    size(): Graph<This['length'], F>

    /**
     * Combines all array values of the object. Like: _.reduce(this, _.assign, {})
     */
    assign(): Graph<UnionToIntersection<Value>, F>

    /**
     * Combines all array values of the object, in reverse order. Like: _.reduce(this, _.defaults, {})
     */
    defaults(): Graph<UnionToIntersection<Value>, F>

    /**
     * Resolves to the first item in an array
     */
    head(): Graph<This[0], F>

    /**
     * Resolves to the last item in an array
     */
    last(): Graph<Value, F>

    /**
     * Resolves to the sum of numbers in a number array
     */
    sum(): Value extends number ? Graph<number, F> : never

    /**
     * Joins an array of strings to a single strings, like this.join(separator)
     * @param separator 
     */
    join(separator: Argument<string, F>): Value extends string ? Graph<string, F> : never

    reverse(): Graph<Value[], F>

    /**
     * Runs the functor for every item in an array. Returns a graph that resolves to an array with the returned values.
     * 
     * @param functor A function to run for every item of the array
     * @param scope A variable to pass to the functor if inside another functor.
     */
    map<Scope, Ret>(functor: (value: ValueGraph, key?: KeyGraph, scope?: Scope) => Argument<Ret, F>, scope?: Scope) : Graph<Ret[], F>

    /**
     * Returns a boolean graph that resolves to true if running the functor on any of the array's item resolved to true
     * 
     * @param functor A function to run for every item of the array, returning boolean
     * @param scope A variable to pass to the functor if inside another functor.
     */
    any<Scope>(functor: (value: ValueGraph, key?: KeyGraph, scope?: Scope) => Argument<boolean, F>, scope?: Scope) : Graph<boolean, F>

    /**
     * Returns an object graph that resolves to an object containing keys returned by functor, pointing to their corresponding values.
     * 
     * @param functor A function to run for every item of the array, returning a string as a new key
     * @param scope A variable to pass to the functor if inside another functor.
     */
    keyBy<Scope, Ret extends Argument<string, F>>(functor: (value: Value, key?: Key, scope?: Scope) => Argument<Ret, F>, scope?: Scope) :
        Ret extends string ? {[name in Ret]: Value} : {[name: string]: Value}

    /**
     * Returns an array graph containing only the values for which the functor resolved to true
     * 
     * @param functor A function to run for every item of the array, returning a boolean
     * @param scope A variable to pass to the functor if inside another functor.
     */
    filter<Scope>(functor: (value: ValueGraph, key?: KeyGraph, scope?: Scope) => Argument<boolean, F>, scope?: Scope) : Graph<Value[], F>

    /**
     * Resolved to the first value for which the functor resolved to true
     * 
     * @param functor A function to run for every item of the array, returning a boolean
     * @param scope A variable to pass to the functor if inside another functor.
     */
    find<Scope>(functor: (value: ValueGraph, key?: KeyGraph, scope?: Scope) => Argument<boolean, F>, scope?: Scope) : ValueGraph

    /**
     * Resolved to the index of the first value for which the functor resolved to true, or -1 if not found.
     * 
     * @param functor A function to run for every item of the array, returning a boolean
     * @param scope A variable to pass to the functor if inside another functor.
     */
    findIndex<Scope>(functor: (value: ValueGraph, key?: KeyGraph, scope?: Scope) => Argument<boolean, F>, scope?: Scope) : KeyGraph

    /**
     * Returns a value that is a result of running functor on all the items of the array in order, each time with the previous result of functor.
     * 
     * @param functor A function to run for every item of the array, with the previous value as aggregate
     * @param initialValue The aggregate to pass to the first argument.
     */
    reduce<Ret>(functor: (aggregate: Argument<Ret, F>, value?: ValueGraph, key?: KeyGraph) => Argument<Ret, F>, initialValue?: Ret): This extends any[]? Ret : never

    /**
     * Returns an array with an additional element (value) at its end
     * 
     * @param value A value to add to the array, or a graph resolving to that value
     */
    append<T>(value: Argument<T, F>) : Graph<(Value|T)[], F>

    /**
     * Resolves to an array which is a concatenated results of this and one or more additional arrays
     * @param arrays 
     */
    concat<T>(...arrays: Argument<T[], F>[]) : Graph<(Value|T)[], F>

    /**
     * Resolves to true if the array contains an argument equal to value
     * @param value 
     */
    includes(value: Argument<Value, F>): Graph<boolean, F>

    /**
     * Resolves to an array with size identical to this, with each element resolving to the result of functor on the equivalent element in this.
     * The functor is given a "loop" parameter, which can be used to retrieve the functor's result on a different key. For example:
     * 
     * // Will resolve to [1, 2, 4, 8, ...]
     * recursiveMap((loop, value, key) => key.eq(0).ternary(1, key.minus(1).recur(loop).multiply(2)))
     * 
     * @param functor 
     * @param scope 
     */

    recursiveMap<Scope, Ret>(functor: (loop: Looper<Ret>, value?: Value, key?: Key, scope?: Scope) => Argument<Ret, F>, scope?: Scope): Graph<Ret[], F>
}

interface ObjectGraphImpl<This extends object, F extends FunctionLibrary,
    Key = keyof This,
    Value = This[keyof This],
    ValueGraph = Graph<Value, F>,
    KeyGraph = Graph<keyof This, F>> extends ArrayOrObjectGraphImpl<This, F> {

    /**
     * Resolves to the number of keys in the object
     */
    size(): Graph<number, F>

    /**
     * Resolves to an array representing the keys of the object
     */
    keys(): Graph<Key[], F>

    /**
     * Resolves to an array representing the values of the object
     */
    values(): Graph<Value[], F>

    /**
     * Resolves to true if this has the given key as a key
     * @param key A potential key of this
     */
    has(key: Argument<string, F>): Graph<boolean, F>

    /**
     * Resolve to true if this object has a value equal to the value argument
     * @param value 
     */
    includesValue(value: Argument<Value, F>): Graph<boolean, F>

    /**
     * Resolves to a new object with the entries for which the functor has resolved to true
     * 
     * @param functor 
     * @param scope 
     */
    filterBy<Scope>(functor: (value: ValueGraph, key?: KeyGraph, scope?: Scope) => Argument<boolean, F>, scope?: Scope) : Graph<This, F>

    /**
     * Resolves to a new object with only the keys passed as argument
     * 
     * @param functor 
     * @param scope 
     */
    pick<K extends keyof This>(keys: Argument<K[], F>): Graph<{[key in K]: This[K]}, F>

    /**
     * Resolves to an object with the same keys, with each value resolves to the return value of functor on the corresponding entry.
     * 
     * @param functor 
     * @param scope 
     */
    mapValues<Scope, Ret>(functor: (value: ValueGraph, key?: KeyGraph, scope?: Scope) => Argument<Ret, F>, scope?: Scope) : Key extends string ? Graph<{[name in Key]: Ret}, F> : never

    /**
     * Resolves to an object with the same values, with each key resolves to the return value of functor on the corresponding entry.
     * 
     * @param functor 
     * @param scope 
     */
    mapKeys<Scope, Ret extends Argument<string, F>>(functor: (value: Value, key?: Key, scope?: Scope) => Argument<Ret, F>, scope?: Scope) : 
        Graph<{[key in Ret extends string ? Ret : string]: Value}, F>

    /**
     * Resolves to a boolean representing whether the object contains any value for which the functor has resolved to true
     * 
     * @param functor 
     * @param scope 
     */
    anyValues<Scope>(functor: (value: ValueGraph, key?: KeyGraph, scope?: Scope) => Argument<boolean, F>, scope?: Scope) : Graph<boolean, F>

    /**
     * Returns a new object with the keys returned by the functor, and the values resolves to arrays with all the elements which returned that key
     */
    groupBy<Scope, Ret>(functor: (value: ValueGraph, key?: KeyGraph, scope?: Scope) => Argument<Ret, F>, scope?: Scope) : Graph<{[key: string]: Value[]}, F>

    /**
     * Returns a new object which resolves to _.assign(this, value)
     * @param value 
     */
    assignIn<V extends object>(value: Argument<V, F>[]): Graph<This & V, F>

    setIn(path: string[]): Graph<This, F>

    /**
     * Resolves to an object with keys identical to this, with each element resolving to the result of functor on the equivalent element in this.
     * The functor is given a "loop" parameter, which can be used to retrieve the functor's result on a different key. For example:
     * 
     * @param functor 
     * @param scope 
     */
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
    effect<FunctionName extends keyof F, Args>(func: FunctionName, ...args: Args[]): Graph<ReturnType<F[FunctionName]>, F>
    bind<FunctionName extends keyof F, BoundArgs, Args>(func: FunctionName, ...boundArgs: BoundArgs[]): (...args: Args[]) => ReturnType<F[FunctionName]>
    compile(transformations: object, options?: object): string
    withSchema<Schema, F extends FunctionLibrary = {}>(model?: Schema, functions?: F): API<Schema, F>
    abstract(name: string): Graph<any, F>
    implement(iface: Graph<any, F>, name: string): void
    arg0: Token
    arg1: Token
    arg2: Token
}


declare const DefaultAPI : API
export = DefaultAPI