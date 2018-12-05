/// <reference path="typings/index.d.ts" />
export function inferFromModel<ExampleNativeModel>(expressionRoot: carmi.Expression, model: ExampleNativeModel) : carmi.asExpression<ExampleNativeModel>
export function chain<NativeType>(native: NativeType) : carmi.asExpression<NativeType>
export function and<T extends carmi.Expression>(...args: T[]): T
export function or<T extends carmi.Expression>(...args: T[]): T
export function setter(...path: carmi.PathSegment[]) : carmi.SetterExpression
export function splice(...path: carmi.PathSegment[]) : carmi.SpliceExpression
export function compile(transformations: {[name: string]: carmi.GetterOrSetterExpression}, options?: object) : string | Promise<String>
export const root : carmi.GetterExpression
export const arg0 : carmi.Token
export const arg1 : carmi.Token
export const arg2 : carmi.Token
export const key: carmi.LeafExpression
export const val: carmi.GetterExpression
