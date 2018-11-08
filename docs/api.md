---
id: api
title: API
---

## Exports

CARMI exports only a few APIs -

1.  compile(model, {compiler,name,output}) - takes a model (a plain JS object with two types of properties - either a
    state derivations or a setter) and generates the source code for a function which receives two parameters - the
    actual initial state and an optional function library and returns an object with the defined derivations and
    setters. Whenever you trigger a setter the derivations update incrementally
2.  root - a token which represents the root of your state, which is used to create your derived state Directed Acyclic
    Graph,
3.  chain(obj/array/primitive) - wrap a native JS object with the declarative APIs that are available on root & every
    derivation from root
4.  and()/or() - logical operands for your state derivations
5.  setter(...path)/splice(...path) - declare actions which can be triggered on your state to change it (use
    arg0/arg1/arg2 - to define placeholders in the path)

## Deriving state DSL

Every piece of state **root** **chain()** and everything derived from them using these APIs out of them has the
following APIs, these are inspired by lodash to make transition to CAMRI easier for developers with frontend experience
All of them return objects which represent the computation - remember there are no values in compile time.

- **get**(key/index) - takes an object/array returns the specific key/index from the object/array
- **size**() - expects an object/array returns it's size

### array operands

- **map**((item,key,context) => result<, context>) - takes an array returning a new array with same length with the
  results of calling the function on each item in the array
- **any**((item,key,context) => result<,context>) - returns true if the result of function is true for any of the items
  in the array
- **keyBy**((item,key,context) => result<,context>) - exepcts an array returns an object with keys equal to the result
  of the function for each item and the values are the source items on the array
- **filter**((item,key,context) => result<,context>) - expects an array returns an array with only the items that pass
  the filter function

* **assign**() - takes an array returns the result of Object.assign({}, ...array)
* **defaults**() - takes an array returns the result of Object.assign({}, ...[...src].reverse())

### object operands

- **mapValues**((item,key,context) => result<,context>) - takes an object returns an object with the same keys but with
  values equal to the result of passing each item in the original object through the function
- **mapKeys**((item,key,context) => result<,context>) - takes an object returns an object with the same values but with
  keys equal to the result of passing each item in the original object through the function
- **anyValues**((item,key,context) => result<,context>) - expects an object returns true if the function evaluates to
  true on any of the properties of the object
- **filterBy**((item,key,context) => result<,context>) - expects an object returns a subset of the object with only the
  properties for which the function evaluated to true
- **groupBy**((item,key,context) => result<,context>) - expects an object returns an object where the keys are the
  results of passing each item in original object through the function and values are the filtered subset of the
  properties on the original object which evaluated to this value
- **values**() - expects an object returns an array with all its values
- **keys**() - expects an object returns an array with all its keys

### object/array recursions

- **recursiveMap**((loop, item, key, context) => result<,context>) - takes an array returning a new array with same
  length with the results of calling the function on each item in the array, and the function can use the loop variable
  (<something>.recur(loop)) to read the values of other indexes in the result array
- **recursiveMapValues**((loop, item, key, context) => result<,context>) - - takes an object returns an object with the
  same keys but with values equal to the result of passing each item in the original object through the function, and
  the function can use the loop variable (<something>.recur(loop)) to read the values of other properties in the result
  object
- **recur**(loop): takes a key/index and returns the value of the recursion in that index/key

### logical operands

- **not**()
- **ternary**(valueIfTrue, valueIfFalse)
- **eq**(value) - equals value
- **gt**(value) - greater than
- **lt**(value) - less than
- **gte**(value) - greater than or equal
- **lte**(value) - less than or equal

### primitive operands

- **plus**(value) - plus value (either numbers or strings)
- **minus**(value) - minus value
- **mult**(value) - multiply value
- **div**(value) - divide by value
- **mod**(value) - modulo value
- **range**([start = 0][, skip = 1]) - expects an integer end value returns an array with the values [start...end]

#### using the function library

- **call**(functionName, ...extraArgs) - call a function called functionName from the function library passes the
  current value as the first argument, and extra arguments are well... extra
