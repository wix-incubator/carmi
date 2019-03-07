---
id: Graph
title: Graph
sidebar_label: Graph
---
## `bind(func)`
Creates a function that invokes functionName from the function library with args prepended to the arguments it receives.

## `breakpoint()`
Generates a breakpoint (debugger clause), continuing the graph

## `call(func, args)`
Returns a graph that resolves to the return type of a named function from the function library

## `conditionalBreakpoint(condition)` 🍬
Triggers a breakpoint if the condition resolves to true.

## `conditionalTrace(condition)` 🍬
Generates a console statement, continuing the chain if condition resolves to true.

## `effect(func, args)`
??

## `eq(other)`
Returns a boolean graph that resolves to the value of (NativeType === other)

## `isArray()`
returns true if the context is of type Array

## `isBoolean()`
returns true if the context is of type boolean

## `isNumber()`
returns true if the context is of type number

## `isString()`
returns true if the context is of type string

## `isUndefined()`
returns true if the context is undefined

## `not()`
Resolves to !NativeType

## `recur(loop)`
When run on a key inside a recursiveMap/recursiveMapValues functor,
will return the resolved value for a given key. NativeType allows returning values for indicies of a map based on other values.

## `switchCase(caseTuples, defaultCase)` 🍬
Resolves to the case that matches equals to the boxed value

## `tapTrace(tapFn)` 🍬
lets you tap into the value and traces the result of tapFn

## `ternary(consequence, alternate)`
Resolves to either consequence or alternate, based on the value of NativeType.
Note that both options will be evaluated, even if one of them is not semantically possible.

## `trace(label)`
Generates a console statement, continuing the chain.

