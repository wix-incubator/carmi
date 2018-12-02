export as namespace carmi;
interface ExpressionLoopContext {}
interface Expression {
  call(functionName: string, ...args: any[]) : GetterExpression
  bind(functionName: string, ...args: any[]) : GetterExpression    
}

type MapPredicate<ValueType extends Expression, KeyType extends Expression, ReturnType extends Expression, ScopeType extends Expression> =
  (value?: ValueType, key?: KeyType, scope?: ScopeType) => ReturnType

type RecursePredicate<ValueType extends Expression, KeyType extends Expression, ReturnType extends Expression, ScopeType extends Expression> =
  (loop: ExpressionLoopContext, value?: ValueType, key?: KeyType, scope?: ScopeType) => ReturnType

interface PrimitiveExpression extends Expression {
  not(): BoolExpression
  ternary(consequence: Expression, alternate: Expression): void
  eq(other: PrimitiveExpression): BoolExpression
  gt(other: StringOrNumberArgument): BoolExpression
  gte(other: StringOrNumberArgument): BoolExpression
  lt(other: StringOrNumberArgument): BoolExpression
  lte(other: StringOrNumberArgument): BoolExpression
  recur(loop: ExpressionLoopContext): GetterExpression
}

interface StringExpression extends PrimitiveExpression {
  startsWith(s: StringArgument) : BoolExpression
  endsWith(s: StringArgument) : BoolExpression
  plus(num: StringArgument): StringExpression
  toUpperCase(): StringExpression
  toLowerCase(): StringExpression
}

interface NumberExpression extends PrimitiveExpression {
  minus(value: StringOrNumberArgument): NumberExpression
  mult(value: StringOrNumberArgument): NumberExpression
  plus(num: StringOrNumberArgument): NumberExpression
  plus(str: StringArgument): StringExpression
  div(value: StringOrNumberArgument): NumberExpression
  mod(value: StringOrNumberArgument): NumberExpression
  range(start?: NumberArgument, skip?: NumberArgument): ArrayExpression<NumberExpression>
}
type StringArgument = StringExpression | string
type NumberArgument = NumberExpression | number
type StringOrNumberArgument = StringArgument | NumberArgument
interface BoolExpression extends PrimitiveExpression {
}

interface ObjectOrArrayExpression<ValueType extends Expression, ModelType> extends Expression {
  get<IndexType>(index: IndexType): IndexType extends keyof ModelType ? NativeToExpression<ModelType[IndexType]> : ValueType
  size(): NumberExpression
}

interface ArrayExpression<ValueType extends Expression, ModelType = ValueType[]> extends ObjectOrArrayExpression<ValueType, ModelType> {
  map<ScopeType extends Expression, RetType extends Expression>(predicate: MapPredicate<ValueType, NumberExpression, RetType, ScopeType>, scope?: ScopeType): ArrayExpression<RetType>
  any<ScopeType extends Expression>(predicate: MapPredicate<ValueType, NumberExpression, BoolExpression, ScopeType>, scope?: ScopeType): BoolExpression
  keyBy<ScopeType extends Expression>(predicate: MapPredicate<ValueType, NumberExpression, StringExpression | NumberExpression, ScopeType>, scope?: ScopeType): ObjectExpression<ValueType>
  filter<ScopeType extends Expression>(predicate: MapPredicate<ValueType, NumberExpression, BoolExpression, ScopeType>, scope?: ScopeType): ArrayExpression<ValueType>
  assign(): ObjectExpression<ValueType>
  defaults(): ObjectExpression<ValueType>
  recursiveMap<ScopeType extends Expression, RetType extends Expression>(predicate: RecursePredicate<ValueType, NumberExpression, RetType, ScopeType>, scope?: ScopeType): ArrayExpression<RetType> 
  reduce<ScopeType extends Expression, RetType extends Expression>(predicate: (aggregate: RetType, value: ValueType, key: NumberExpression) => RetType, initialValue: RetType, scope: ScopeType): RetType
  concat(...arrays: ArrayExpression<ValueType>[]): ArrayExpression<ValueType>
}

interface ObjectExpression<ValueType extends Expression, ModelType = {[name: string]: ValueType}> extends ObjectOrArrayExpression<ValueType, ModelType> {
  mapValues<ScopeType extends Expression, RetType extends Expression>(predicate: MapPredicate<ValueType, StringExpression | NumberExpression, RetType, ScopeType>, scope?: ScopeType): ObjectExpression<RetType>
  mapKeys<ScopeType extends Expression>(predicate: MapPredicate<ValueType, StringExpression | NumberExpression, StringExpression | NumberExpression, ScopeType>, scope?: ScopeType): ObjectExpression<ValueType>
  anyValues<ScopeType extends Expression>(predicate: MapPredicate<ValueType, StringExpression | NumberExpression, BoolExpression, ScopeType>, scope?: ScopeType): BoolExpression
  filterBy<ScopeType extends Expression>(predicate: MapPredicate<ValueType, StringExpression | NumberExpression, BoolExpression, ScopeType>, scope?: ScopeType): ObjectExpression<ValueType>
  groupBy<ScopeType extends Expression>(predicate: MapPredicate<ValueType, StringExpression | NumberExpression, StringExpression | NumberExpression, ScopeType>, scope?: ScopeType): ObjectExpression<ObjectExpression<ValueType>>
  values(): ArrayExpression<ValueType>
  keys(): ArrayExpression<StringExpression | NumberExpression>
  recursiveMapValues<ScopeType extends Expression, RetType extends Expression>(predicate: RecursePredicate<ValueType, NumberExpression, RetType, ScopeType>, scope?: ScopeType): ObjectExpression<RetType>
}

type AnyLeafExpression = BoolExpression & NumberExpression & StringExpression
type AnyExpression<T extends Expression> = ObjectExpression<T> & ArrayExpression<T> & AnyLeafExpression
type GetterExpression = AnyExpression<AnyExpression<AnyLeafExpression>>

export function chain(str: string) : StringExpression
export function chain(n: number) : NumberExpression
export function chain(b: boolean) : BoolExpression
export function chain<T extends Expression>(o: object) : ObjectExpression<T> | ArrayExpression<T>
declare class Token {private $type: string}
type PathSegment = Token | string | number
declare class SetterExpression {}
declare class SpliceExpression {}
export function and<A extends Expression, B extends Expression>(a: A, b: B): A | B
export function or<A extends Expression, B extends Expression>(a: A, b: B): A | B
export function and(...args: Expression[]): GetterExpression
export function or(...args: Expression[]): GetterExpression
type GetterOrSetterExpression = SetterExpression | SpliceExpression | GetterExpression


export function setter(...path: PathSegment[]) : SetterExpression
export function splice(...path: PathSegment[]) : SpliceExpression
export function compile(transformations: {[name: string]: GetterOrSetterExpression}, options?: object) : string | Promise<String>
export const root : GetterExpression
export const arg0 : Token
export const arg1 : Token
export const arg2 : Token
export const key: PrimitiveExpression
export const val: GetterExpression

interface NativeArrayToExpression<T, A> extends ArrayExpression<NativeToExpression<T>, A> {}
interface NativeObjectToExpression<T, O> extends ObjectExpression<NativeToExpression<T>, O> {}
type NativeToExpression<T> =
                T extends any[] ? NativeArrayToExpression<T[keyof T], T> : 
                T extends object ? NativeObjectToExpression<T[keyof T], T> :
                T extends number ? NumberExpression :
                T extends string ? StringExpression :
                T extends boolean ? BoolExpression : 
                GetterExpression

export function forModel<T>(v: T) : NativeToExpression<T>
