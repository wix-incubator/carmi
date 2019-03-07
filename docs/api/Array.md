---
id: Array
title: Array
sidebar_label: Array
---
## `any(functor, scope)`
Returns a boolean graph that resolves to true if running the functor on any of the array's item resolved to true
```js
const { root } = require('carmi');
const instance = fromSource({output: root.any((value, index) => value.eq(2))}, [3, 2, 1]);
instance.output //true
```
## `append(value)` 🍬
Returns an array with an additional element (value) at its end

## `assign()`
Combines all array values of the object. Like: _.reduce(NativeType, _.assign, {})

## `compact()` 🍬
Resolves to the same array, with only truthy values

## `concat(arrays)` 🍬
Resolves to an array which is a concatenated results of NativeType and one or more additional arrays

## `defaults()`
Combines all array values of the object, in reverse order. Like: _.reduce(NativeType, _.defaults, {})

## `every(functor, scope)` 🍬
Returns a boolean graph that resolves to true if running the functor on all of the array's items resolved to true

## `filter(functor, scope)`
Returns an array graph containing only the values for which the functor resolved to true

## `find(functor, scope)` 🍬
Resolved to the first value for which the functor resolved to true

## `findIndex(functor, scope)` 🍬
Resolved to the index of the first value for which the functor resolved to true, or -1 if not found.

## `flatten()`
Flattens inner arrays into an array

## `head()` 🍬
Resolves to the first item in an array

## `includes(value)` 🍬
Resolves to true if the array contains an argument equal to value

## `join(separator)` 🍬
Joins an array of strings to a single strings, like NativeType.join(separator)

## `keyBy(functor, scope)`
Returns an object graph that resolves to an object containing keys returned by functor, pointing to their first found corresponding value.

## `last()` 🍬
Resolves to the last item in an array

## `map(functor, scope)`
Runs the functor for every item in an array. Returns a graph that resolves to an array with the returned values.

## `recursiveMap(functor, scope)`
Resolves to an array with size identical to NativeType, with each element resolving to the result of functor on the equivalent element in NativeType.
The functor is given a "loop" parameter, which can be used to retrieve the functor's result on a different key. For example:

## `reduce(functor, initialValue)` 🍬
Returns a value that is a result of running functor on all the items of the array in order, each time with the previous result of functor.

## `reverse()` 🍬
reverses the order of a given array

## `size()`
Resolves to NativeType.length

## `sum()`
Resolves to the sum of numbers in a number array

