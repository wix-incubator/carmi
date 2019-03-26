---
id: api
title: Api Reference
sidebar_label: Api Reference
custom_edit_url: https://github.com/wix-incubator/carmi/edit/master/typings/index.d.ts
---
## Array
### `any(functor, scope)` 
Returns a boolean graph that resolves to true if running the functor on any of the array's item resolved to true
```js
const { root } = require('carmi');
const instance = createInstance({output: root.any((value, index) => value.eq(2))}, [3, 2, 1]);
instance.output //true
```
### `append(value)` 🍬
Returns an array with an additional element (value) at its end

### `assign()` 
Combines all array values of the object. Like: _.reduce(NativeType, _.assign, {})

### `compact()` 🍬
Resolves to the same array, with only truthy values

### `concat(arrays)` 🍬
Resolves to an array which is a concatenated results of NativeType and one or more additional arrays

### `defaults()` 
Combines all array values of the object, in reverse order. Like: _.reduce(NativeType, _.defaults, {})

### `every(functor, scope)` 🍬
Returns a boolean graph that resolves to true if running the functor on all of the array's items resolved to true

### `filter(functor, scope)` 
Returns an array graph containing only the values for which the functor resolved to true

### `find(functor, scope)` 🍬
Resolved to the first value for which the functor resolved to true

### `findIndex(functor, scope)` 🍬
Resolved to the index of the first value for which the functor resolved to true, or -1 if not found.

### `flatten()` 
Flattens inner arrays into an array

### `fromPairs()` 🍬
Converts an array of [key, value] pairs to an object

### `head()` 🍬
Resolves to the first item in an array

### `includes(value)` 🍬
Resolves to true if the array contains an argument equal to value

### `join(separator)` 🍬
Joins an array of strings to a single strings, like NativeType.join(separator)

### `keyBy(functor, scope)` 
Returns an object graph that resolves to an object containing keys returned by functor, pointing to their first found corresponding value.
```js
const { root, chain } = require('carmi');
const instance = createInstance({
  output: root
    .keyBy(item => item.get('items').size())
    .mapValues(item => item.get('items'))
}, [{items: [1]}, {items: [1, 2]}, {items: [1, 2, 3]}, {items: [1, 2, 3, 4]}]);
instance.output // {1: [1], 2: [1, 2], 3: [1, 2, 3], 4: [1, 2, 3, 4]}
```
### `last()` 🍬
Resolves to the last item in an array

### `map(functor, scope)` 
Runs the functor for every item in an array. Returns a graph that resolves to an array with the returned values.

### `recursiveMap(functor, scope)` 
Resolves to an array with size identical to NativeType, with each element resolving to the result of functor on the equivalent element in NativeType.
The functor is given a "loop" parameter, which can be used to retrieve the functor's result on a different key. For example:

### `reduce(functor, initialValue)` 🍬
Returns a value that is a result of running functor on all the items of the array in order, each time with the previous result of functor.

### `reverse()` 🍬
reverses the order of a given array

### `size()` 
Resolves to NativeType.length

### `sum()` 
Resolves to the sum of numbers in a number array

## Array or Object
### `get(key)` 
returns the specific key/index from the object/array

### `getIn(path)` 🍬
Resolves to the deep value provided by path.

### `has(key)` 
returns true if the key/index exists on the object/array

### `isEmpty()` 🍬
does the object/array has any items

## External
### `abstract(name)` 
Defines a projection that would be implementated later in the code using the [`implement(iface, name)`](api.html#implementiface-name) method

### `and(a)` 
logical operand and

### `bind(func)` 
Creates a function that invokes functionName from the function library with args prepended to the arguments it receives.

### `call(func, args)` 
call a function called functionName from the function library passes the current value as the first argument, and extra arguments are well... extra

### `chain(t)` 
wraps a native JS object with the declarative APIs
```js
const { root, chain } = require('carmi');
 const instance = createInstance({
   output: chain([{
     shelf: root.get(0).get('shelf'),
     books: [ root.get(1).get(root.get(0).get('shelf')).get(0) ]
  }])
  .assign()
 }, [{shelf: 'scifi'}, {scifi: ['a scanner darkly']}]);
 instance.output //{books: ["a scanner darkly"], shelf: "scifi"}
```
### `effect(func, args)` 
Like call but will exectue even if the parameters mutation resulted in the same values.<br/>
**Please note**: `effect(func, args)` is a leaf and ends the chain, and its return value cannot be used.

### `implement(iface, name)` 
uses a previously declared abstract clause and assigns an actual value to the named abstract

### `or(a, b)` 
logical operand or

### `push(path)` 
declare a setter that adds an element to the end of an array. The setter will create the array if it doesn't exist

### `setter(path)` 
declare actions which can be triggered on your state to change it (use arg0/arg1/arg2 - to define placeholders in the path)

### `splice(path)` 
declare actions which can be triggered on your state to change it (use arg0/arg1/arg2 - to define placeholders in the path)

### `withName(name, g)` 
this is a dubug feature which allows to name the actual projection functions on the carmi root

## Graph
### `bind(func)` 
Creates a function that invokes functionName from the function library with args prepended to the arguments it receives.

### `breakpoint()` 
Generates a breakpoint (debugger clause), continuing the graph

### `call(func, args)` 
Returns a graph that resolves to the return type of a named function from the function library

### `conditionalBreakpoint(condition)` 🍬
Triggers a breakpoint if the condition resolves to true.

### `conditionalTrace(condition)` 🍬
Generates a console statement, continuing the chain if condition resolves to true.

### `effect(func, args)` 
??

### `eq(other)` 
Returns a boolean graph that resolves to the value of (NativeType === other)

### `isArray()` 
returns true if the context is of type Array

### `isBoolean()` 
returns true if the context is of type boolean

### `isNumber()` 
returns true if the context is of type number

### `isString()` 
returns true if the context is of type string

### `isUndefined()` 
returns true if the context is undefined

### `not()` 
Resolves to !NativeType

### `recur(loop)` 
When run on a key inside a recursiveMap/recursiveMapValues functor,
will return the resolved value for a given key. NativeType allows returning values for indicies of a map based on other values.

### `switchCase(caseTuples, defaultCase)` 🍬
Resolves to the case that matches equals to the boxed value

### `tapTrace(tapFn)` 🍬
lets you tap into the value and traces the result of tapFn

### `ternary(consequence, alternate)` 
Resolves to either consequence or alternate, based on the value of NativeType.
Note that both options will be evaluated, even if one of them is not semantically possible.

### `trace(label)` 
Generates a console statement, continuing the chain.

## Number
### `ceil()` 
Resolves to Math.ceil(NativeType)

### `div(value)` 
Resolves to (NativeType / other)

### `floor()` 
Resolves to Math.floor(NativeType)

### `gt(other)` 
Resolves to (NativeType > other)

### `gte(other)` 
Resolves to (NativeType >= other)

### `lt(other)` 
Resolves to (NativeType < other)

### `lte(other)` 
Resolves to (NativeType <= other)

### `minus(value)` 
Resolves to (NativeType - other)

### `mod(value)` 
Resolves to (NativeType % other)

### `mult(value)` 
Resolves to (NativeType * other)

### `plus(num)` 
Resolves to (NativeType + other)

### `range(start, skip)` 
creates a number array graph

### `round()` 
Resolves to Math.round(NativeType)

## Object
### `anyValues(functor, scope)` 
Resolves to a boolean representing whether the object contains any value for which the functor has resolved to true

### `assignIn(value)` 🍬
Returns a new object which resolves to _.assign(NativeType, value)

### `filterBy(functor, scope)` 
Resolves to a new object with the entries for which the functor has resolved to true

### `groupBy(functor, scope)` 
Returns a new object with the keys returned by the functor, and the values resolves to arrays with all the elements which returned that key

### `has(key)` 
Resolves to true if NativeType has the given key as a key

### `includesValue(value)` 🍬
Resolve to true if NativeType object has a value equal to the value argument

### `keys()` 
Resolves to an array representing the keys of the object

### `mapKeys(functor, scope)` 
Resolves to an object with the same values, with each key resolves to the return value of functor on the corresponding entry.

### `mapValues(functor, scope)` 
Resolves to an object with the same keys, with each value resolves to the return value of functor on the corresponding entry.

### `pick(keys)` 🍬
Resolves to a new object with only the keys passed as argument

### `recursiveMapValues(functor, scope)` 
Resolves to an object with keys identical to NativeType, with each element resolving to the result of functor on the equivalent element in NativeType.
The functor is given a "loop" parameter, which can be used to retrieve the functor's result on a different key. For example:

### `setIn(path)` 🍬
Sets value for given path

### `simpleSet(path)` 🍬
Sets value for given key

### `size()` 
Resolves to the number of keys in the object

### `toPairs()` 🍬
Converts an object to an array of [key, value] pairs

### `values()` 
Resolves to an array representing the values of the object

## String
### `endsWith(s)` 
Resolves to (NativeType.endsWith(s))

### `parseInt(radix)` 
Resolves to parseInt(NativeType, radix)

### `plus(other)` 
Resolves to (NativeType + s)

### `split(separator)` 
Resolves to an array graph, like NativeType.split(separator)

### `startsWith(s)` 
Resolves to (NativeType.startsWith(s))

### `stringLength()` 
returns the string length

### `substring(start, end)` 
Resolves String.substring

### `toLowerCase()` 
Resolves to NativeType.toLowerCase()

### `toUpperCase()` 
Resolves to NativeType.toUpperCase()
