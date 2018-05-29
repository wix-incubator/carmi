export as namespace carmi;

type StringNumberPrimitive = string | number | PrimitiveExpression;

declare class BaseExpression {
  public not(): PrimitiveExpression;
  public ternary(ifTrueValue: any, elseValue: any): Expression;
  public recur(loopExpression: Expression): Expression;
  public call(functionName: string, ...args: any[]): Expression;
}

declare class PrimitiveExpression extends BaseExpression {
  public range(): ArrayExpression;
  public eq(compareTo: Expression): PrimitiveExpression;
  public gt(compareTo: Expression): PrimitiveExpression;
  public lt(compareTo: Expression): PrimitiveExpression;
  public gte(compareTo: Expression): PrimitiveExpression;
  public lte(compareTo: Expression): PrimitiveExpression;
  public plus(to: Expression): PrimitiveExpression;
  public minus(to: Expression): PrimitiveExpression;
  public mult(to: Expression): PrimitiveExpression;
  public div(to: Expression): PrimitiveExpression;
  public mod(to: Expression): PrimitiveExpression;
}

declare class ArrayOrObjectExpression extends BaseExpression {
  public get(idx: StringNumberPrimitive): Expression;
  public size(): PrimitiveExpression;
}

type FuncReturnsExpression = (
  val: Expression,
  key: PrimitiveExpression,
  context: Expression
) => ArrayExpression | ObjectExpression | PrimitiveExpression;
type FuncThatReturnsRecursiveExpression = (
  loop: PrimitiveExpression,
  val: Expression,
  key: PrimitiveExpression,
  context: Expression
) => ArrayExpression | ObjectExpression | PrimitiveExpression;

declare class ObjectExpression extends ArrayOrObjectExpression {
  public mapValues(func: string | number | Expression | FuncReturnsExpression, context?: any): ObjectExpression;
  public recursiveMapValues(
    func: string | number | Expression | FuncThatReturnsRecursiveExpression,
    context?: any
  ): ObjectExpression;
  public anyValues(func: string | number | Expression | FuncReturnsExpression, context?: any): PrimitiveExpression;
  public filterBy(func: string | number | Expression | FuncReturnsExpression, context?: any): ObjectExpression;
  public mapKeys(func: string | number | Expression | FuncReturnsExpression, context?: any): ObjectExpression;
  public groupBy(func: string | number | Expression | FuncReturnsExpression, context?: any): ObjectExpression;
  public values(): ArrayExpression;
  public keys(): ArrayExpression;
}
declare class ArrayExpression extends ArrayOrObjectExpression {
  public map(func: string | number | Expression | FuncReturnsExpression, context?: any): ArrayExpression;
  public recursiveMap(
    func: string | number | Expression | FuncThatReturnsRecursiveExpression,
    context?: any
  ): ArrayExpression;
  public any(func: string | number | Expression | FuncReturnsExpression, context?: any): PrimitiveExpression;
  public keyBy(func: string | number | Expression | FuncReturnsExpression, context?: any): ObjectExpression;
  public filter(func: string | number | Expression | FuncReturnsExpression, context?: any): ArrayExpression;
  public assign(): ObjectExpression;
  public defaults(): ObjectExpression;
}

type Expression = ArrayExpression & ObjectExpression & PrimitiveExpression;

declare class Token {
  private $type;
}

type PathSegment = Token | string | number;

declare class SetterExpression {}
declare class SpliceExpression {}

declare interface Model {
  [name: string]: Expression | SetterExpression | SpliceExpression;
}

export const root: Expression;
export const arg0: Token;
export const arg1: Token;
export const arg2: Token;
export const loop: PrimitiveExpression;
export const key: PrimitiveExpression;
export const val: Expression;
export const context: Expression;

export function or(...expr: any[]): Expression;
export function and(...expr: any[]): Expression;
export function chain(thingToWrap: boolean | number | string): PrimitiveExpression;
export function chain(thingToWrap: any): Expression;

export function compile(model: Model, options?: any): string | Promise<string>;
export function setter(...path: PathSegment[]): SetterExpression;
export function splice(...path: PathSegment[]): SpliceExpression;
