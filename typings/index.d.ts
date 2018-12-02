declare namespace carmi {
  interface LoopContext<ValueType> { }
  interface TraverseContext<ValueType> { }
  interface Expression {
    call(functionName: string, ...args: any[]): GetterExpression
    bind(functionName: string, ...args: any[]): GetterExpression
  }

  type MapPredicate<ValueType extends Expression, KeyType extends Expression, ReturnType extends Expression, ScopeType extends Expression> =
    (value?: ValueType, key?: KeyType, scope?: ScopeType) => ReturnType

  type RecursePredicate<ValueType extends Expression, KeyType extends Expression, ReturnType extends Expression, ScopeType extends Expression> =
    (loop: LoopContext<ReturnType>, value?: ValueType, key?: KeyType, scope?: ScopeType) => ReturnType

  type TreePredicate<ValueType extends Expression, ReturnType extends Expression, ScopeType extends Expression> =
    (loop: TraverseContext<ReturnType>, value?: ValueType, scope?: ScopeType) => ReturnType

  interface PrimitiveExpression extends Expression {
    not(): BoolExpression
    ternary(consequence: Expression, alternate: Expression): void
    eq(other: PrimitiveExpression): BoolExpression
    gt(other: StringOrNumberArgument): BoolExpression
    gte(other: StringOrNumberArgument): BoolExpression
    lt(other: StringOrNumberArgument): BoolExpression
    lte(other: StringOrNumberArgument): BoolExpression
    recur<ReturnType extends Expression>(loop: LoopContext<ReturnType>): ReturnType
  }

  interface StringExpression extends PrimitiveExpression {
    startsWith(s: StringArgument): BoolExpression
    endsWith(s: StringArgument): BoolExpression
    plus(num: StringArgument): StringExpression
    split(s: StringArgument): ArrayExpression<StringExpression>
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
  interface BoolExpression extends PrimitiveExpression { }

  interface ObjectOrArrayExpression<ValueType extends Expression, ExampleModelType> extends Expression {
    get<IndexType extends keyof ExampleModelType>(index: IndexType): asExpression<ExampleModelType[IndexType]>
    // TODO: deep resolving of getIn
    getIn<FirstArgType extends keyof ExampleModelType, NextArgTypes extends keyof ExampleModelType>(path: [FirstArgType, ...(NextArgTypes[])]) :
      GetterOrSetterExpression
    tree<ScopeType extends Expression, ReturnType extends Expression>(predicate: TreePredicate<asExpression<ExampleModelType>, ReturnType, ScopeType>, scope?: ScopeType) : ReturnType
    traverse<ReturnType>(context: TraverseContext<ReturnType>) : ReturnType 
    size(): NumberExpression
  }

  interface ArrayExpression<ValueType extends Expression, ExampleModelType = ValueType[]> extends ObjectOrArrayExpression<ValueType, ExampleModelType> {
    map<ScopeType extends Expression,
      RetType extends Expression>(predicate: MapPredicate<ValueType, NumberExpression, RetType, ScopeType>, scope?: ScopeType): ArrayExpression<RetType>
    any<ScopeType extends Expression>(predicate: MapPredicate<ValueType, NumberExpression, BoolExpression, ScopeType>, scope?: ScopeType): BoolExpression
    keyBy<ScopeType extends Expression>(predicate: MapPredicate<ValueType, NumberExpression, StringExpression | NumberExpression, ScopeType>, scope?: ScopeType): ObjectExpression<ValueType>
    filter<ScopeType extends Expression>(predicate: MapPredicate<ValueType, NumberExpression, BoolExpression, ScopeType>, scope?: ScopeType): ArrayExpression<ValueType>
    assign<V>(): ValueType extends ObjectExpression<infer V> ? ObjectExpression<V> : never
    assign<V>(): ValueType extends ObjectExpression<infer V> ? ObjectExpression<V> : never
    recursiveMap<ScopeType extends Expression,
      RetType extends Expression>(predicate: RecursePredicate<ValueType, NumberExpression, RetType, ScopeType>, scope?: ScopeType): ArrayExpression<RetType>
    reduce<ScopeType extends Expression,
      RetType extends Expression>(predicate: (aggregate: RetType, value: ValueType, key: NumberExpression) => RetType, initialValue: RetType, scope: ScopeType): RetType
    concat(...arrays: ArrayExpression<ValueType>[]): ArrayExpression<ValueType>
    join(separator: string | StringExpression): StringExpression
    sum(): NumberExpression
  }

  interface ObjectExpression<ValueType extends Expression, ExampleModelType = {[name: string]: ValueType}> extends ObjectOrArrayExpression<ValueType, ExampleModelType> {
    mapValues<ScopeType extends Expression,
      RetType extends Expression>(predicate: MapPredicate<ValueType, StringExpression | NumberExpression, RetType, ScopeType>, scope?: ScopeType): ObjectExpression<RetType>
    mapKeys<ScopeType extends Expression>(predicate: MapPredicate<ValueType, StringExpression | NumberExpression, StringExpression | NumberExpression, ScopeType>, scope?: ScopeType): ObjectExpression<ValueType>
    anyValues<ScopeType extends Expression>(predicate: MapPredicate<ValueType, StringExpression | NumberExpression, BoolExpression, ScopeType>, scope?: ScopeType): BoolExpression
    filterBy<ScopeType extends Expression>(predicate: MapPredicate<ValueType, StringExpression | NumberExpression, BoolExpression, ScopeType>, scope?: ScopeType): ObjectExpression<ValueType>
    groupBy<ScopeType extends Expression>(predicate: MapPredicate<ValueType, StringExpression | NumberExpression, StringExpression | NumberExpression, ScopeType>, scope?: ScopeType): ObjectExpression<ObjectExpression<ValueType>>
    values(): ArrayExpression<ValueType>
    assignIn<FirstObject extends object, NextObject extends object>(obj: FirstObject, args: NextObject[]) : asExpression<FirstObject & NextObject>
    keys(): ArrayExpression<StringExpression | NumberExpression>
    recursiveMapValues<ScopeType extends Expression,
      RetType extends Expression>(predicate: RecursePredicate<ValueType, NumberExpression, RetType, ScopeType>, scope?: ScopeType): ObjectExpression<RetType>
  }

  type LeafExpression = BoolExpression | NumberExpression | StringExpression
  interface RecursiveObjectExpression extends ObjectExpression<GetterExpression> { }
  interface RecursiveArrayExpression extends ArrayExpression<GetterExpression> { }
  type GetterExpression = RecursiveObjectExpression | RecursiveArrayExpression | LeafExpression
  class Token {private $type: string}
  type PathSegment = Token | string | number
  interface SetterExpression { }
  interface SpliceExpression { }
  type GetterOrSetterExpression = SetterExpression | SpliceExpression | GetterExpression
  interface asArrayExpression<T extends any[]> extends ArrayExpression<asExpression<T[number]>, T> { }
  interface asObjectExpression<T> extends ObjectExpression<asExpression<T[keyof T]>, T> { }
  type asExpression<T> =
    T extends Expression ? T :
    T extends any[] ? asArrayExpression<T> :
    T extends {[name: string]: any} ? asObjectExpression<T> :
    T extends number ? NumberExpression :
    T extends string ? StringExpression :
    T extends boolean ? BoolExpression :
    never
}
