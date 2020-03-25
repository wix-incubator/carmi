export interface FunctionLibrary {
	[name: string]: (...args: any[]) => any
}
interface Looper<T> {}

type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends ((k: infer I) => void) ? I : never

interface AbstractGraph {
	$isCarmiGraph: true
}
export interface GraphBase<NativeType> extends AbstractGraph {
	$value: NativeType
}

export type AsNative<T> = T extends GraphBase<infer N> ? N : T
export type Argument<T> = AsNative<T> | GraphBase<T> | T

type AsNativeRecursive<T> = AsNative<T> extends any[]
	? AsNative<T>
	: AsNative<T> extends object
	? { [k in keyof AsNative<T>]: AsNative<AsNative<T>[k]> }
	: AsNative<T>
type BoundFunction<F, A = unknown, B = unknown, C = unknown, D = unknown, E = unknown> = unknown extends A
	? (F extends (...args: infer Args) => infer R ? F : never)
	: unknown extends B
	? (F extends (a: A, ...args: infer Args) => infer R ? (...args: Args) => R : never)
	: unknown extends C
	? (F extends (a: A, b: B, ...args: infer Args) => infer R ? (...args: Args) => R : never)
	: unknown extends D
	? (F extends (a: A, b: B, c: C, ...args: infer Args) => infer R ? (...args: Args) => R : never)
	: unknown extends E
	? (F extends (a: A, b: B, c: C, d: D, ...args: infer Args) => infer R ? (...args: Args) => R : never)
	: never

export interface BoolGraph<F extends FunctionLibrary> extends GraphImpl<boolean, F> {}
export interface FunctionGraph<N, F extends FunctionLibrary> extends GraphImpl<N, F> {}

/**
 * Graph
 */
interface GraphImpl<NativeType, F extends FunctionLibrary> extends GraphBase<NativeType> {
	/**
	 * Returns a graph that resolves to the return type of a named function from the function library.
	 *
	 * @param func A function name from the function library
	 * @param args Args to pass, in addition to the value resolved from ""
	 */
	call<
		FunctionName extends keyof F,
		Arguments extends F[FunctionName] extends (firstArg: NativeType, ...args: infer Args) => any ? Args : never
	>(
		func: FunctionName,
		...args: Arguments extends (infer A)[] ? Argument<A>[] : never
	): Graph<ReturnType<F[FunctionName]>, F>
	/**
	 * Like call but will exectue even if the parameters mutation resulted in the same values.
	 * **Please note**: `effect(func, args)` is a leaf and ends the chain, and its return value cannot be used.
	 */
	effect<
		FunctionName extends keyof F,
		Arguments extends F[FunctionName] extends (firstArg: NativeType, ...args: infer Args) => any ? Args : never
	>(
		func: FunctionName,
		...args: Arguments extends (infer A)[] ? Argument<A>[] : never
	): void

	/**
	 * Creates a function that invokes functionName from the function library with args prepended to the arguments it receives.
	 */
	bind<FunctionName extends keyof F>(func: FunctionName): FunctionGraph<BoundFunction<F[FunctionName], NativeType>, F>
	bind<FunctionName extends keyof F, A>(
		func: FunctionName,
		a: A
	): FunctionGraph<BoundFunction<F[FunctionName], NativeType, A>, F>
	bind<FunctionName extends keyof F, A, B>(
		func: FunctionName,
		a: A,
		b: B
	): FunctionGraph<BoundFunction<F[FunctionName], NativeType, A, B>, F>
	bind<FunctionName extends keyof F, A, B, C>(
		func: FunctionName,
		a: A,
		b: B,
		c: C
	): FunctionGraph<BoundFunction<F[FunctionName], NativeType, A, B, C>, F>
	bind<FunctionName extends keyof F, A, B, C, D>(
		func: FunctionName,
		a: A,
		b: B,
		c: C,
		d: D
	): FunctionGraph<BoundFunction<F[FunctionName], NativeType, A, B, C, D>, F>

	/**
	 * Generates a breakpoint (debugger clause), continuing the graph.
	 */
	breakpoint(): this

	/**
	 * Generates a console statement, continuing the chain.
	 * @param label if provided, label is printed alongside the trace info
	 */
	trace(label?: string): this

	/**
	 * Generates a console statement, continuing the chain if condition resolves to true.
	 * @param condition
	 * @sugar */
	conditionalTrace<FunctionName extends keyof F>(condition: FunctionName): this

	/**
	 * Triggers a breakpoint if the condition resolves to true.
	 * @param condition
	 * @sugar */
	conditionalBreakpoint<FunctionName extends keyof F>(condition: FunctionName): this

	/**
	 * Lets you tap into the value and traces the result of tapFn.
	 * @param tapFn
	 * @sugar */
	tapTrace<FunctionName extends keyof F>(tapFn: FunctionName): this

	/**
	 * Resolves to `!NativeType`.
	 */
	not(): BoolGraph<F>

	/**
	 * Resolves to either consequence or alternate, based on the value of NativeType.
	 * Note that both options will be evaluated, even if one of them is not semantically possible.
	 *
	 * @param consequence graph if NativeType value is truthy
	 * @param alternate graph is NativeType value is falsey
	 */
	ternary<Consequence, Alternate>(
		consequence: Consequence,
		alternate: Alternate
	): Graph<
		AsNative<Consequence> extends AsNative<Alternate>
			? Consequence
			: AsNative<Alternate> extends AsNative<Consequence>
			? Alternate
			: Consequence extends null
			? Alternate
			: Alternate extends null
			? Consequence
			: Alternate | Consequence,
		F
	>

	/**
	 * Resolves to the case that matches equals to the boxed value.
	 *
	 * @param caseTuples An array of pairs between a value and a consequent
	 * @param defaultCase The graph to return in case no given case matches the boxed value
	 * @sugar */
	switch<DefaultCase, TupleType extends [Argument<NativeType>, any]>(
		caseTuples: Array<TupleType>,
		defaultCase: DefaultCase
	): Graph<DefaultCase, F> | Graph<TupleType extends [Argument<NativeType>, infer Result] ? Result : never, F>

	/**
	 * Returns a boolean graph that resolves to the value of (NativeType === other).
	 * @param other
	 */
	eq(other: Argument<unknown>): BoolGraph<F>

	/**
	 * When run on a key inside a recursiveMap/recursiveMapValues functor,
	 * will return the resolved value for a given key. NativeType allows returning values for indicies of a map based on other values.
	 * @param loop passed to the functor of recursiveMap/recursiveMapValues
	 */
	recur<ValueType>(loop: Looper<ValueType>): ValueType

	/**
	 * Returns true if the context is of type `Array`.
	 */
	isArray(): BoolGraph<F>

	/**
	 * Returns true if the context is `undefined`.
	 */
	isUndefined(): BoolGraph<F>

	/**
	 * Returns true if the context is of type `boolean`.
	 */
	isBoolean(): BoolGraph<F>

	/**
	 * Returns true if the context is of type `number`.
	 */
	isNumber(): BoolGraph<F>

	/**
	 * Returns true if the context is of type `string`.
	 */
	isString(): BoolGraph<F>
}

/**
 * Number
 */
export interface NumberGraph<NativeType extends number, F extends FunctionLibrary> extends GraphImpl<NativeType, F> {
	/**
	 * Resolves to (NativeType > other).
	 * @param other
	 */
	gt(other: Argument<number>): BoolGraph<F>

	/**
	 * Resolves to (NativeType >= other).
	 * @param other
	 */
	gte(other: Argument<number>): BoolGraph<F>

	/**
	 * Resolves to (NativeType < other).
	 * @param other
	 */
	lt(other: Argument<number>): BoolGraph<F>

	/**
	 * Resolves to (NativeType <= other).
	 * @param other
	 */
	lte(other: Argument<number>): BoolGraph<F>

	/**
	 * Resolves to (NativeType - other).
	 * @param other
	 */
	minus(value: Argument<number>): NumberGraph<number, F>

	/**
	 * Resolves to (NativeType * other).
	 * @param other
	 * @example
	 * const { root } = require('carmi')
	 * const instance = createInstance({
	 *     output: root.mult(2)
	 * }, 2)
	 * instance.output //4
	 */
	mult(value: Argument<number>): NumberGraph<number, F>

	/**
	 * Resolves to (NativeType + other).
	 * @param other
	 */
	plus(num: Argument<number>): NumberGraph<number, F>
	plus(str: Argument<string>): StringGraph<string, F>

	/**
	 * Resolves to (NativeType / other).
	 * @param other
	 */
	div(value: Argument<number>): NumberGraph<number, F>

	/**
	 * Resolves to (NativeType % other).
	 * @param other
	 */
	mod(value: Argument<number>): NumberGraph<number, F>

	/**
	 * Creates a number array graph.
	 *
	 * @param start number to start from
	 * @param skip number to skip between values
	 * @returns a number array graph, with size equal to resolved "NativeType"
	 */
	range(start?: Argument<number>, skip?: Argument<number>): NumberGraph<number, F>[]

	/**
	 * Resolves to Math.floor(NativeType).
	 */
	floor(): NumberGraph<number, F>

	/**
	 * Resolves to Math.ceil(NativeType).
	 */
	ceil(): NumberGraph<number, F>

	/**
	 * Resolves to Math.round(NativeType).
	 */
	round(): NumberGraph<number, F>
}

/**
 * String
 */
export interface StringGraph<NativeType extends string, F extends FunctionLibrary> extends GraphImpl<NativeType, F> {
	/**
	 * Resolves to (NativeType.startsWith(s)).
	 * @param s other string
	 */
	startsWith(s: Argument<string>): BoolGraph<F>

	/**
	 * Resolves to (NativeType.endsWith(s)).
	 * @param s other string
	 */
	endsWith(s: Argument<string>): BoolGraph<F>

	/**
	 * Resolves to (NativeType + s).
	 * @param other other string
	 */
	plus(other: Argument<string | number>): StringGraph<string, F>

	/**
	 * Resolves to an array graph, like NativeType.split(separator).
	 * @param separator
	 */
	split(separator: Argument<string>): ArrayGraph<string[], F>

	/**
	 * Resolves to NativeType.toUpperCase().
	 */
	toUpperCase(): StringGraph<string, F>

	/**
	 * Resolves to NativeType.toLowerCase().
	 */
	toLowerCase(): StringGraph<string, F>

	/**
	 * Returns the string length.
	 */
	stringLength(): NumberGraph<number, F>

	/**
	 * Resolves `String.substring`.
	 * @param start
	 * @param end
	 *
	 * Resolves String.substring
	 */
	substring(start: Argument<number>, end: Argument<number>): StringGraph<string, F>

	/**
	 * Resolves to parseInt(NativeType, radix).
	 * @param radix base (10, 16 etc)
	 */
	parseInt(radix?: number): NumberGraph<number, F>

	/**
	 * Resolves to parseFloat(NativeType).
	 */
	parseFloat(): NumberGraph<number, F>
}

/**
 * Array or Object
 */
interface ArrayOrObjectGraphImpl<NativeType extends any[] | object, F extends FunctionLibrary, Key = keyof NativeType>
	extends GraphImpl<NativeType, F> {
	/**
	 * Returns the specific key/index from the object/array.
	 */
	get<K extends keyof NativeType>(
		key: K | AbstractGraph
	): K extends AbstractGraph ? Graph<NativeType[keyof NativeType], F> : Graph<NativeType[K], F>

	/**
     * Checks if the object or array graph is empty.
     @sugar */
	isEmpty(): BoolGraph<F>

	/**
	 * Resolves to the deep value provided by the path.
	 * @param path
	 * @sugar */
	getIn<K extends keyof NativeType>(path: [Argument<K>]): Graph<NativeType[K], F>
	getIn<
		K0 extends keyof NativeType,
		K1 extends keyof V0,
		V0 = NonNullable<NativeType[K0]>
	>(
		path: [Argument<K0>, Argument<K1>]
	): Graph<V0[K1], F>
	getIn<
		K0 extends keyof NativeType,
		K1 extends keyof V0,
		K2 extends keyof V1,
		V0 = NonNullable<NativeType[K0]>,
		V1 = NonNullable<V0[K1]>
	>(
		path: [Argument<K0>, Argument<K1>, Argument<K2>]
	): Graph<V1[K2], F>
	getIn<
		K0 extends keyof NativeType,
		K1 extends keyof V0,
		K2 extends keyof V1,
		K3 extends keyof V2,
		V0 = NonNullable<NativeType[K0]>,
		V1 = NonNullable<V0[K1]>,
		V2 = NonNullable<V1[K2]>
	>(
		path: [Argument<K0>, Argument<K1>, Argument<K2>, Argument<K3>]
	): Graph<V2[K3], F>
	getIn<
		K0 extends keyof NativeType,
		K1 extends keyof V0,
		K2 extends keyof V1,
		K3 extends keyof V2,
		K4 extends keyof V3,
		V0 = NonNullable<NativeType[K0]>,
		V1 = NonNullable<V0[K1]>,
		V2 = NonNullable<V1[K2]>,
		V3 = NonNullable<V2[K3]>
	>(
		path: [Argument<K0>, Argument<K1>, Argument<K2>, Argument<K3>, Argument<K4>]
	): Graph<V3[K4], F>
	getIn<
		K0 extends keyof NativeType,
		K1 extends keyof V0,
		K2 extends keyof V1,
		K3 extends keyof V2,
		K4 extends keyof V3,
		K5 extends keyof V4,
		V0 = NonNullable<NativeType[K0]>,
		V1 = NonNullable<V0[K1]>,
		V2 = NonNullable<V1[K2]>,
		V3 = NonNullable<V2[K3]>,
		V4 = NonNullable<V3[K4]>
	>(
		path: [Argument<K0>, Argument<K1>, Argument<K2>, Argument<K3>, Argument<K4>, Argument<K5>]
	): Graph<V4[K5], F>
	getIn<
		K0 extends keyof NativeType,
		K1 extends keyof V0,
		K2 extends keyof V1,
		K3 extends keyof V2,
		K4 extends keyof V3,
		K5 extends keyof V4,
		K6 extends keyof V5,
		V0 = NonNullable<NativeType[K0]>,
		V1 = NonNullable<V0[K1]>,
		V2 = NonNullable<V1[K2]>,
		V3 = NonNullable<V2[K3]>,
		V4 = NonNullable<V3[K4]>,
		V5 = NonNullable<V4[K5]>
	>(
		path: [Argument<K0>, Argument<K1>, Argument<K2>, Argument<K3>, Argument<K4>, Argument<K5>, Argument<K6>]
	): Graph<V5[K6], F>
	/**
	 * Returns true if the key/index exists on the object/array.
	 */
	has(key: Argument<string> | Argument<number>): BoolGraph<F>
}

/**
 * Array
 */
interface ArrayGraphImpl<
	NativeType extends any[],
	F extends FunctionLibrary,
	Value = NativeType extends (infer V)[] ? AsNative<V> : never,
	Key = keyof NativeType,
	ValueGraph = Graph<Value, F>,
	KeyGraph = NumberGraph<number, F>
> extends ArrayOrObjectGraphImpl<Value[], F> {
	/**
	 * Resolves to NativeType.length
	 */
	size(): NumberGraph<NativeType['length'], F>

	/**
	 * Combines all array values of the object. Like: `_.reduce(NativeType, _.assign, {})`
	 */
	assign<T = NativeType extends object ? true : never>(): ObjectGraph<
		// @ts-ignore
		AsNativeRecursive<UnionToIntersection<Value>>,
		F
	>

	/**
	 * Combines all array values of the object, in reverse order. Like: `_.reduce(NativeType, _.defaults, {})`
	 */
	defaults<T = NativeType extends object ? true : never>(): ObjectGraph<
		// @ts-ignore
		AsNativeRecursive<UnionToIntersection<Value>>,
		F
	>

	/**
	 * Resolves to the first item in an array.
	 * @sugar */
	head(): ValueGraph

	/**
	 * Resolves to the last item in an array.
	 * @sugar */
	last(): ValueGraph

	/**
	 * Resolves to the sum of numbers in a number array.
	 *
	 */
	sum(): Value extends number ? NumberGraph<number, F> : never

	/**
	 * Reverses the order of a given array.
	 * @sugar */
	reverse(): ArrayGraph<Value[], F>

	/**
	 * Runs the functor for every item in an array. Returns a graph that resolves to an array with the returned values.
	 *
	 * @param functor A function to run for every item of the array
	 * @param scope A variable to pass to the functor if inside another functor.
	 * @example
	 * const { root } = require('carmi')
	 * const instance = createInstance({
	 *     output: root.map( item => item.mult(2))
	 * }, [3, 2, 1])
	 * instance.output //[6, 4, 2]
	 */
	map<Scope, T extends (value: ValueGraph, key: KeyGraph, scope: Scope) => any>(
		functor: T,
		scope?: Scope
	): ArrayGraph<Array<AsNativeRecursive<ReturnType<T>>>, F>

	/**
	 * Returns a graph that resolves to an array with the value at propName of each corresponding entry.
	 *
	 * @param propName The property name
	 * @example
	 * const { root } = require('carmi')
	 * const input = [{age: 3}, {age: 2}, {age: 1}]
	 * const instance = createInstance({
	 *     output: root.map('age')
	 * }, input)
	 * instance.output //[3, 2, 1]
	 */
	map<K extends keyof Value>(propName: K): ArrayGraph<Array<Value[K]>, F>

	/**
	 * Returns a boolean graph that resolves to *true* if at least one element in the array
	 * passes the test implemented by the provided functor.
	 *
	 * @param functor A function to run for every item of the array, returning boolean
	 * @param scope A variable to pass to the functor if inside another functor.
	 * @example
	 * const { root } = require('carmi')
	 * const instance = createInstance({
	 *     output: root.any((value, index) => value.eq(2))
	 * }, [3, 2, 1])
	 * instance.output //true
	 */
	any<Scope>(
		functor: (value: ValueGraph, key: KeyGraph, scope: Scope) => Argument<boolean>,
		scope?: Scope
	): BoolGraph<F>

	/**
	 * Returns a boolean graph that resolves to true if running the functor on all of the array's items resolved to true.
	 *
	 * @param functor A function to run for every item of the array, returning boolean
	 * @param scope A variable to pass to the functor if inside another functor.
	 * @sugar */
	every<Scope>(
		functor: (value: ValueGraph, key: KeyGraph, scope: Scope) => Argument<boolean>,
		scope?: Scope
	): BoolGraph<F>

	/**
	 * Returns an object graph that resolves to an object containing keys returned by functor, pointing to their first found corresponding value.
	 *
	 * @param functor A function to run for every item of the array, returning a string as a new key
	 * @param scope A variable to pass to the functor if inside another functor.
	 * @example
	 * const { root, chain } = require('carmi');
	 * const instance = createInstance({
	 *   output: root
	 *     .keyBy(item => item.get('items').size())
	 *     .mapValues(item => item.get('items'))
	 * }, [{items: [1]}, {items: [1, 2]}, {items: [1, 2, 3]}, {items: [1, 2, 3, 4]}]);
	 * instance.output // {1: [1], 2: [1, 2], 3: [1, 2, 3], 4: [1, 2, 3, 4]}
	 **/
	keyBy<Scope, Ret extends Argument<string | number>>(
		functor: (value: ValueGraph, key: KeyGraph, scope: Scope) => Argument<Ret>,
		scope?: Scope
	): ObjectGraph<Ret extends string ? { [name in Ret]: Value } : { [name: string]: Value }, F>

	/**
	 * Returns an array graph containing only the values for which the functor resolved to `true`.
	 *
	 * @param functor A function to run for every item of the array, returning a boolean
	 * @param scope A variable to pass to the functor if inside another functor.
	 * @example
	 * const { root } = require('carmi')
	 * const instance = createInstance({
	 *     output: root.filter( item => item.mod(2))
	 * }, [3, 2, 1])
	 * instance.output //[3, 1]
	 */
	filter<Scope>(functor: (value: ValueGraph, key: KeyGraph, scope: Scope) => any, scope?: Scope): ArrayGraph<Value[], F>

	/**
	 * Resolved to the index of the first value for which the functor resolved to true, or -1 if not found.
	 *
	 * @param functor A function to run for every item of the array, returning a boolean
	 * @param scope A variable to pass to the functor if inside another functor.
	 * @sugar */
	findIndex<Scope>(
		functor: (value: ValueGraph, key: KeyGraph, scope: Scope) => Argument<boolean>,
		scope?: Scope
	): KeyGraph

	/**
	 * Returns a value that is a result of running functor on all the items of the array in order, each time with the previous result of functor.
	 *
	 * @param functor A function to run for every item of the array, with the previous value as aggregate
	 * @param initialValue The aggregate to pass to the first argument.
	 * @sugar */
	reduce<Ret>(
		functor: (aggregate: Argument<Ret>, value: ValueGraph, key: KeyGraph) => Argument<Ret>,
		initialValue?: Ret
	): NativeType extends any[] ? Ret : never

	/**
	 * Resolves to an array which is a concatenated results of NativeType and one or more additional arrays.
	 * @param arrays
	 * @sugar */
	concat<T>(...arrays: Argument<T[]>[]): ArrayGraph<(Value | T)[], F>

	/**
	 * Resolves to an array of unique values that are included in given arrays.
	 * @param arrays
	 * @sugar */
	intersection<T>(...arrays: Argument<T[]>[]): ArrayGraph<(Value | T)[], F>

	/**
	 * Resolves to the first value for which the functor resolves to `true`.
	 *
	 * @param functor A function to run for every item of the array, returning a boolean
	 * @param scope A variable to pass to the functor if inside another functor.
	 * @sugar */
	find<Scope>(functor: (value: ValueGraph, key: KeyGraph, scope: Scope) => Argument<boolean>, scope?: Scope): ValueGraph

	/**
	 * Joins an array of strings to a single string, like `NativeType.join(separator)`.
	 * @param separator
	 * @sugar */
	join(separator: Argument<string>): Value extends string ? StringGraph<string, F> : never

	/**
	 * Returns an array graph with an additional element (value) at the end.
	 *
	 * @param value A value to add to the array, or a graph resolving to that value
	 * @sugar */
	append<T>(value: Argument<T>): ArrayGraph<(Value | T)[], F>

	/**
	 * Flattens inner arrays into an array.
	 */
	flatten<T = Value extends any[] ? true : never>(): ValueGraph

	/**
	 * Resolves to true if the array contains an argument equal to value.
	 * @param value
	 * @sugar */
	includes(value: Argument<Value>): BoolGraph<F>

	/**
	 * Resolves to the same array, with only `true` values
	 * @sugar */
	compact(): this

	/**
	 * Resolves to a duplicate-free version of an array
	 * @sugar */
	uniq(): this

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
	recursiveMap<Scope, Ret>(
		functor: (loop: Looper<Ret>, value: Value, key: Key, scope: Scope) => Argument<Ret>,
		scope?: Scope
	): ArrayGraph<Ret[], F>
}

/**
 * Object
 */

interface ObjectGraphImpl<
	NativeType extends { [key: string]: any },
	F extends FunctionLibrary,
	Key = keyof NativeType & string,
	Value = AsNative<NativeType[keyof NativeType]>,
	ValueGraph = Graph<Value, F>,
	KeyGraph = Graph<Key, F>
> extends ArrayOrObjectGraphImpl<{ [key in keyof NativeType]: AsNative<NativeType[key]> }, F> {
	/**
	 * Resolves to the number of keys in the object
	 */
	size(): NumberGraph<number, F>

	/**
	 * Resolves to true if NativeType has the given key as a key
	 * @param key A potential key of NativeType
	 */
	has(key: Argument<string>): BoolGraph<F>

	/**
	 * Resolves to true if NativeType object has a value equal to the value argument.
	 *
	 * @param value
	 * @sugar */
	includesValue(value: Argument<Value>): BoolGraph<F>

	/**
	 * Resolves to a new object with the entries for which the functor has resolved to true.
	 *
	 * @param functor
	 * @param scope
	 */
	filterBy<Scope>(functor: (value: ValueGraph, key: KeyGraph, scope: Scope) => any, scope?: Scope): this

	/**
	 * Resolves to a new object with only the keys passed as argument
	 *
	 * @param keys
	 * @sugar */
	pick<K extends keyof NativeType, Keys extends Array<K>>(keys: Keys): ObjectGraph<Pick<NativeType, Keys[number]>, F>

	/**
	 * Resolves to an object with the same keys, with each value resolves to the return value of functor on the corresponding entry.
	 *
	 * @param functor
	 * @param scope
	 */
	mapValues<Scope, T extends (value: ValueGraph, key: KeyGraph, scope: Scope) => any>(
		functor: T,
		scope?: Scope
	): ObjectGraph<{ [name in keyof NativeType]: AsNativeRecursive<ReturnType<T>> }, F>

	/**
	 * Resolves to an object with the same keys, with each value resolves to the value at propName of the corresponding entry.
	 * This is equivalent to x => x.get(propName)
	 *
	 * @param propName property name
	 */
	mapValues<K extends keyof Value>(
		propName: Argument<K>
	): ObjectGraph<{ [name in keyof NativeType]: AsNativeRecursive<Value[K]> }, F>

	/**
	 * Resolves to an object with the same values, with each key resolves to the return value of functor on the corresponding entry.
	 *
	 * @param functor
	 * @param scope
	 */
	mapKeys<Scope, T extends (value: ValueGraph, key: KeyGraph, scope: Scope) => any>(
		functor: T,
		scope?: Scope
	): ObjectGraph<{ [key in ReturnType<T> extends string ? ReturnType<T> : string]: Value }, F>

	/**
	 * Resolves to an object with the same values, with each key resolves to the value at propName of the corresponding entry.
	 *
	 * @param propName property name
	 */
	mapKeys<K extends keyof Value>(propName: Argument<K>): ObjectGraph<{ [key: string]: Value }, F>

	/**
	 * Resolves to a boolean representing whether the object contains any value for which the functor has resolved to true
	 *
	 * @param functor
	 * @param scope
	 */
	anyValues<Scope>(
		functor: (value: ValueGraph, key: KeyGraph, scope: Scope) => Argument<boolean>,
		scope?: Scope
	): BoolGraph<F>

	/**
	 * Returns a new object with the keys returned by the functor, and the values resolves to arrays with all the elements which returned that key.
	 */
	groupBy<Scope, Ret>(
		functor: (value: ValueGraph, key: KeyGraph, scope: Scope) => Argument<Ret>,
		scope?: Scope
	): ObjectGraph<{ [key: string]: NativeType }, F>

	/**
	 * Returns a new object which resolves to `_.assign(NativeType, value)`.
	 *
	 * @param value
	 * @sugar */
	assignIn<V extends object>(value: Argument<V>[]): ObjectGraph<NativeType & AsNativeRecursive<V>, F>

	/**
	 * Sets value for given key.
	 *
	 * @param key The property name
	 * @param value The value to set
	 * @sugar */
	simpleSet<Key extends string, Value>(key: Key, value: Argument<Value>): ObjectGraph<NativeType & {[key in Key]: Value}, F>

	/**
	 * Sets value for given path.
	 *
	 * @param path[] Array
	 * @param value
	 * @sugar */
	setIn(path: string[], value: any): ObjectGraph<NativeType, F>

	/**
	 * Resolves to an object with keys identical to NativeType, with each element resolving to the result of functor on the equivalent element in NativeType.
	 * The functor is given a "loop" parameter, which can be used to retrieve the functor's result on a different key. For example:
	 *
	 * @param functor
	 * @param scope
	 */
	recursiveMapValues<
		Scope,
		Functor extends (looper: Looper<unknown>, value: ValueGraph, key: KeyGraph, scope: Scope) => any
	>(
		functor: Functor,
		scope?: Scope
	): ObjectGraph<{ [name in keyof NativeType]: AsNativeRecursive<ReturnType<Functor>> }, F>

	/**
	 * Resolves to an array representing the keys of the object.
	 *
	 */
	keys(): ArrayGraph<Key[], F>

	/**
	 * Resolves to an array representing the values of the object.
	 *
	 */
	values(): ArrayGraph<Value[], F>
}

interface Expression {}
export interface Token {
	$type: string
}
type PathSegment = Token | string | number
type SetterExpression<Model, Path, F> = {}
type SpliceExpression<Model, Path, F> = {}
type PushExpression<Model, Path, F> = {}

export interface ArrayGraph<T extends any[], F extends FunctionLibrary> extends ArrayGraphImpl<T, F> {}
export interface ObjectGraph<T extends object, F extends FunctionLibrary> extends ObjectGraphImpl<AsNative<T>, F> {}

export type Graph<N, F extends FunctionLibrary> = N extends AbstractGraph
	? N
	: N extends any[]
	? ArrayGraph<N, F>
	: N extends Function
	? FunctionGraph<N, F>
	: N extends string
	? StringGraph<N, F>
	: N extends number
	? NumberGraph<N, F>
	: N extends boolean
	? BoolGraph<F>
	: N extends object
	? ObjectGraph<N, F>
	: never

/**
 * External
 */
export interface CarmiAPI<Schema extends object = any, F extends FunctionLibrary = any> {
	$schema: Schema
	$functions: F
	root: ObjectGraph<Schema, F>

	/**
	 * Wraps a native JS object with the declarative APIs.
	 *
	 * @example
	 *  const { root, chain } = require('carmi');
	 *  const instance = createInstance({
	 *    output: chain([{
	 *      shelf: root.get(0).get('shelf'),
	 *      books: [ root.get(1).get(root.get(0).get('shelf')).get(0) ]
	 *   }])
	 *   .assign()
	 *  }, [{shelf: 'scifi'}, {scifi: ['a scanner darkly']}]);
	 *  instance.output //{books: ["a scanner darkly"], shelf: "scifi"}
	 */
	chain<T>(t: T): Graph<AsNativeRecursive<T>, F>

	/**
	 * Logical operand or.
	 */
	or<A>(a: A, b: never[] | {}): Graph<A, F>
	or<A, B>(a: A, b: B, c: never[] | {}): Graph<A, F> | Graph<B, F>
	or<A, B, C>(a: A, b: B, c: C, d: never[] | {}): Graph<A, F> | Graph<B, F> | Graph<C, F>
	or<A, B, C, D>(a: A, b: B, c: C, d: D, e: never[] | {}): Graph<A, F> | Graph<B, F> | Graph<C, F> | Graph<D, F>
	or<A, B>(a: A, b: B): Graph<A, F> | Graph<B, F>
	or<A, B, C>(a: A, b: B, c: C): Graph<A, F> | Graph<B, F> | Graph<C, F>
	or<A, B, C, D>(a: A, b: B, c: C, d: D): Graph<A, F> | Graph<B, F> | Graph<C, F> | Graph<D, F>
	or<A, B, C, D, E>(a: A, b: B, c: C, d: D, e: E): Graph<A, F> | Graph<B, F> | Graph<C, F> | Graph<D, F> | Graph<E, F>
	or<A, B, C, D, E, FF>(
		a: A,
		b: B,
		c: C,
		d: D,
		e: E,
		f: FF
	): Graph<A, F> | Graph<B, F> | Graph<C, F> | Graph<D, F> | Graph<E, F> | Graph<FF, F>
	or<A>(...args: A[]): Graph<A, F>

	/**
	 * Logical operand and.
	 */
	and<A>(a: A): Graph<A, F>
	and<A, B>(a: A, b: B): Graph<B, F>
	and<A, B, C>(a: A, b: B, c: C): Graph<C, F>
	and<A, B, C, D>(a: A, b: B, c: C, d: D): Graph<D, F>
	and<A, B, C, D, E>(a: A, b: B, c: C, d: D, e: E): Graph<E, F>
	and<A, B, C, D, E, FF>(a: A, b: B, c: C, d: D, e: E, f: FF): Graph<FF, F>
	and<A>(...args: A[]): Graph<A, F>
	/**
	 * Declare actions which can be triggered on your state to change it (use arg0/arg1/arg2 - to define placeholders in the path).
	 * @example
	 * const { root, setter, arg0 } = require('carmi')
	 * const instance = createInstance({
	 *     setItem: setter(arg0),
	 *     output: root.any((value, index) => value.eq(2))
	 * }, [3, 2, 1]);
	 * console.log(instance.output) //true
	 * instance.setItem(1, 3)
	 * instance.output //false
	 */
	setter<Path extends PathSegment[]>(...path: Path): SetterExpression<Schema, Path, F>

	/**
	 * Declare actions which can be triggered on your state to change it (use arg0/arg1/arg2 - to define placeholders in the path).
	 */
	splice<Path extends PathSegment[]>(...path: Path): SpliceExpression<Schema, Path, F>

	/**
	 * Declare a setter that adds an element to the end of an array. The setter will create the array if one doesn't exist.
	 */
	push<Path extends PathSegment[]>(...path: Path): PushExpression<Schema, Path, F>

	/**
	 * Calls the function name passed from the function library while passing current value as the first argument, and then the provided args.
	 */
	call<FunctionName extends keyof F>(
		func: FunctionName,
		...args: Argument<Parameters<F[FunctionName]>[number]>[]
	): Graph<ReturnType<F[FunctionName]>, F>

	/**
	 * See the docs for [`effect(func, args)`](api.html#effectfunc-args-1) in the **Graph** section of this API reference.
	 */
	effect<FunctionName extends keyof F>(
		func: FunctionName,
		...args: Argument<Parameters<F[FunctionName]>[number]>[]
	): Graph<ReturnType<F[FunctionName]>, F>

	/**
	 * Creates a function that invokes `functionName` from the function library with args prepended to the arguments it receives.
	 */
	bind<FunctionName extends keyof F>(func: FunctionName): FunctionGraph<BoundFunction<F[FunctionName]>, F>
	bind<FunctionName extends keyof F, A>(func: FunctionName, a: A): FunctionGraph<BoundFunction<F[FunctionName], A>, F>
	bind<FunctionName extends keyof F, A = Parameters<F[FunctionName]>[0], B = Parameters<F[FunctionName]>[1]>(
		func: FunctionName,
		a: A,
		b: B
	): FunctionGraph<BoundFunction<F[FunctionName], A, B>, F>
	bind<
		FunctionName extends keyof F,
		A = Parameters<F[FunctionName]>[0],
		B = Parameters<F[FunctionName]>[1],
		C = Parameters<F[FunctionName]>[2]
	>(
		func: FunctionName,
		a: A,
		b: B,
		c: C
	): FunctionGraph<BoundFunction<F[FunctionName], A, B, C>, F>
	bind<
		FunctionName extends keyof F,
		A = Parameters<F[FunctionName]>[0],
		B = Parameters<F[FunctionName]>[1],
		C = Parameters<F[FunctionName]>[2],
		D = Parameters<F[FunctionName]>[3]
	>(
		func: FunctionName,
		a: A,
		b: B,
		c: C,
		d: D
	): FunctionGraph<BoundFunction<F[FunctionName], A, B, C, D>, F>
	bind<
		FunctionName extends keyof F,
		A = Parameters<F[FunctionName]>[0],
		B = Parameters<F[FunctionName]>[1],
		C = Parameters<F[FunctionName]>[2],
		D = Parameters<F[FunctionName]>[3],
		E = Parameters<F[FunctionName]>[4]
	>(
		func: FunctionName,
		a: A,
		b: B,
		c: C,
		d: D,
		e: E
	): FunctionGraph<BoundFunction<F[FunctionName], A, B, C, D, E>, F>

	/**
	 * Defines a projection to be implemented later in the code using the [`implement(iface, name)`](api.html#implementiface-name) method.
	 * @param name used for debug only
	 */
	abstract(name: string): Graph<unknown, F>

	/**
	 * Uses a previously declared abstract clause and assigns an actual value to the named abstract.
	 */
	implement(iface: Graph<unknown, F>, name: string): void

	/**
	 * A debug feature that allows to name the actual projection functions on the carmi root.
	 */
	withName<T>(name: string, g: T): T

	/**
	 * This api creates a string using carmi models and the template string method.
	 * @example
	 * const { root, template } = require('carmi');
	 * const instance = createInstance({
	 *   output: template`Second array item is:${root.get(1)}.`
	 * }, [3, 2, 1]);
	 * instance.output //Second array item is:2.
	 */
	template(template: TemplateStringsArray, ...placeholders: any[]): StringGraph<string, F>

	arg0: Token
	arg1: Token
	arg2: Token
}

export const bind: CarmiAPI['bind']
export const or: CarmiAPI['or']
export const and: CarmiAPI['and']
export const setter: CarmiAPI['setter']
export const splice: CarmiAPI['splice']
export const push: CarmiAPI['push']
export const abstract: CarmiAPI['abstract']
export const implement: CarmiAPI['implement']
export const effect: CarmiAPI['effect']
export const call: CarmiAPI['call']
export const chain: CarmiAPI['chain']
export const root: CarmiAPI['root']
export const template: CarmiAPI['template']
export const arg0: CarmiAPI['arg0']
export const arg1: CarmiAPI['arg1']
export const arg2: CarmiAPI['arg2']

declare const carmiDefaultAPI: CarmiAPI
export default carmiDefaultAPI

export function withSchema<Schema extends object, F extends FunctionLibrary>(
	model?: Schema,
	functions?: F
): CarmiAPI<Schema, F>
export function compile(transformations: object, options?: object): string
