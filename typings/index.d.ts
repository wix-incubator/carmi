export as namespace carmi;
interface ExpressionLoopContext {}
interface Expression {
  call(functionName: string, ...args: any[]) : GetterExpression
  bind(functionName: string, ...args: any[]) : GetterExpression    
}

type MapPredicate<ValueType extends Expression, KeyType extends Expression, ReturnType extends Expression, ContextType extends Expression> =
  (value?: ValueType, key?: KeyType, context?: ContextType) => ReturnType

type RecursePredicate<ValueType extends Expression, KeyType extends Expression, ReturnType extends Expression, ContextType extends Expression> =
  (loop: ExpressionLoopContext, value?: ValueType, key?: KeyType, context?: ContextType) => ReturnType

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

interface ObjectOrArrayExpression<ValueType extends Expression> extends Expression {
  get(index: StringOrNumberArgument): ValueType
  size(): NumberExpression
}

interface ArrayExpression<ValueType extends Expression> extends ObjectOrArrayExpression<ValueType> {
  map<ContextType extends Expression, RetType extends Expression>(predicate: MapPredicate<ValueType, NumberExpression, RetType, ContextType>, context?: ContextType): ArrayExpression<RetType>
  any<ContextType extends Expression>(predicate: MapPredicate<ValueType, NumberExpression, BoolExpression, ContextType>, context?: ContextType): BoolExpression
  keyBy<ContextType extends Expression>(predicate: MapPredicate<ValueType, NumberExpression, StringExpression | NumberExpression, ContextType>, context?: ContextType): ObjectExpression<ValueType>
  filter<ContextType extends Expression>(predicate: MapPredicate<ValueType, NumberExpression, BoolExpression, ContextType>, context?: ContextType): ArrayExpression<ValueType>
  assign(): ObjectExpression<ValueType>
  defaults(): ObjectExpression<ValueType>
  recursiveMap<ContextType extends Expression, RetType extends Expression>(predicate: RecursePredicate<ValueType, NumberExpression, RetType, ContextType>, context?: ContextType): ArrayExpression<RetType> 
  reduce<ContextType extends Expression, RetType extends Expression>(predicate: (aggregate: RetType, value: ValueType, key: NumberExpression) => RetType, initialValue: RetType, context: ContextType): RetType
  concat(...arrays: ArrayExpression<ValueType>[]): ArrayExpression<ValueType>
}

interface ObjectExpression<ValueType extends Expression> extends ObjectOrArrayExpression<ValueType> {
  mapValues<ContextType extends Expression, RetType extends Expression>(predicate: MapPredicate<ValueType, StringExpression | NumberExpression, RetType, ContextType>, context?: ContextType): ObjectExpression<RetType>
  mapKeys<ContextType extends Expression>(predicate: MapPredicate<ValueType, StringExpression | NumberExpression, StringExpression | NumberExpression, ContextType>, context?: ContextType): ObjectExpression<ValueType>
  anyValues<ContextType extends Expression>(predicate: MapPredicate<ValueType, StringExpression | NumberExpression, BoolExpression, ContextType>, context?: ContextType): BoolExpression
  filterBy<ContextType extends Expression>(predicate: MapPredicate<ValueType, StringExpression | NumberExpression, BoolExpression, ContextType>, context?: ContextType): ObjectExpression<ValueType>
  groupBy<ContextType extends Expression>(predicate: MapPredicate<ValueType, StringExpression | NumberExpression, StringExpression | NumberExpression, ContextType>, context?: ContextType): ObjectExpression<ObjectExpression<ValueType>>
  values(): ArrayExpression<ValueType>
  keys(): ArrayExpression<StringExpression | NumberExpression>
  recursiveMapValues<ContextType extends Expression, RetType extends Expression>(predicate: RecursePredicate<ValueType, NumberExpression, RetType, ContextType>, context?: ContextType): ObjectExpression<RetType>
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
