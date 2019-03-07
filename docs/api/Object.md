---
id: Object
title: Object
sidebar_label: Object
---
## `anyValues(functor, scope)`
Resolves to a boolean representing whether the object contains any value for which the functor has resolved to true

## `assignIn(value)` 🍬
Returns a new object which resolves to _.assign(NativeType, value)

## `filterBy(functor, scope)`
Resolves to a new object with the entries for which the functor has resolved to true

## `groupBy(functor, scope)`
Returns a new object with the keys returned by the functor, and the values resolves to arrays with all the elements which returned that key

## `has(key)`
Resolves to true if NativeType has the given key as a key

## `includesValue(value)` 🍬
Resolve to true if NativeType object has a value equal to the value argument

## `keys()`
Resolves to an array representing the keys of the object

## `mapKeys(functor, scope)`
Resolves to an object with the same values, with each key resolves to the return value of functor on the corresponding entry.

## `mapValues(functor, scope)`
Resolves to an object with the same keys, with each value resolves to the return value of functor on the corresponding entry.

## `pick(keys)` 🍬
Resolves to a new object with only the keys passed as argument

## `recursiveMapValues(functor, scope)`
Resolves to an object with keys identical to NativeType, with each element resolving to the result of functor on the equivalent element in NativeType.
The functor is given a "loop" parameter, which can be used to retrieve the functor's result on a different key. For example:

## `setIn(path)` 🍬
Sets value for given path

## `simpleSet(path)` 🍬
Sets value for given key

## `size()`
Resolves to the number of keys in the object

## `values()`
Resolves to an array representing the values of the object

