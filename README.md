# CARMI

## Compiler for Automatic Reactive Modelling of Inference

This is a POC of an entirely new approach to modelling infered state, there are 4 classic methods of handling
deriviation of state

1.  The naive - compute from scratch everytime the state is changed
2.  Handle cache invalidation manually with all the world of hurt that entails.
3.  Using Immutable data and caching computation based on the identity of the inputs
4.  Using Functional Reactive Programming to box fragments of your state with getters&setters, running deriviations in a
    way that logs which fragments were read during the computation, and invalidate when one of their setters is invoked

This project is an attempt at a new approach, a DSL+Compiler which are fed two types of inputs:

1.  The deriviation of state you need
2.  The paths in the model you want to write to

The compiler generates JS source code which handles all the reactive cache invalidation automatically

Because the compiler knows in advance all the stuff that can be read/written from/to the model, it can do all sort of
cool stuff that is nearly impossible to do automatically using other approachs

1.  Track conditional consumption of parts of the model only if used with zero over head
2.  Hoisting shared sub expressions, so they are only calculated once
3.  Not track dependencies if there are no setters that can cause the expression to invalidate
4.  All computation is incremental

```js
const { compile, root, and, or, arg0, setter, splice } = require("./index");
const todosByIdx = root.keyBy("idx");
const anyTodoNotDone = todosByIdx.anyValues(todo => todo.get("done").not());
const todosDisplayByIdx = todosByIdx.mapValues(todo =>
  todo.get("task").plus(or(and(todo.get("done"), " - done"), " - not done"))
);
const todosDisplay = root.map(todo => todosDisplayByIdx.get(todo.get("idx")));
const model = {
  todosDisplay,
  anyTodoNotDone,
  setTodoDone: setter(arg0, "done"),
  spliceTodos: splice(),
};

const todosModel = eval(compile(model));
const todos = todosModel([
  { idx: "1", done: false, task: "write a blog post about carmi" },
  { idx: "2", done: true, task: "publish to npm" },
  { idx: "3", done: false, task: "write a demo for carmi" },
]);
console.log(todos.todosDisplay);
/*
[ 'write a demo for carmi - not done',
'write a blog post about carmi - not done',
'publish to npm - done' ]
*/
todos.setTodoDone(2, true); // only todosDisplayByIdx of the demo is recalculated
console.log(todos.todosDisplay);
/*
[ 'write a blog post about carmi - not done',
  'publish to npm - done',
  'write a demo for carmi - done' ]
*/
todos.spliceTodos(0, 3, todos.$model[2], todos.$model[1], todos.$model[0]); // todosDisplayByIdx is not called at all
console.log(todos.todosDisplay);
/*
[ 'write a demo for carmi - done',
  'publish to npm - done',
  'write a blog post about carmi - not done' ]
*/
```

## Usage with Babel Macros

### Using a magic comment

```js
// @carmi

require('carmi/macro') // Activate the macro!

const { root } = require('carmi')
module.exports = { first: root.get(0) }
```

### Using string literals

```js
const carmi = require('carmi/macro')

const modelBuilder = carmi`
  const { root } = require('carmi')
  module.exports = { first: root.get(0) }
`

const model = modelBuilder(["first", "second"])
console.log(model.first) // prints "first"!
```

## Usage with Babel (as a plugin)

Compiles Carmi files (`xxx.carmi.js`) automatically using Babel. It reserves the external modules, required by `require`,
in order to help bundlers (like webpack) understand dependencies across Carmi models (and to help them watch the files).

```js
// @carmi

const { root } = require("carmi");
const { second } = require("./anotherModel.carmi.js");

module.exports = { first: root.get(0), second };
```

turns to:

```js
require("carmi");
require("./anotherModel.camri.js");

module.exports = CARMI_COMPILATION_RESULT;
```

### Add to your babel configuration

Add this plugin to your `.babelrc`:

```
{
  ... babel conf ...,
  "plugins": ["carmi/babel"]
}
```

> Now you're set! :moneybag:

## Usage with Webpack

Compiles Carmi files on the fly with a fly webpack loader.

### Require using webpack configurations

Add this to your webpack configurations:

```
module: {
  rules: [
    {
      test: /\.carmi\.js$/,
      exclude: /(node_modules|bower_components)/,
      use: {
        loader: 'carmi/loader'
      }
    }
  ]
}
```

Then you can just `require('./model.carmi.js')` like a boss

### Require with explicit loader

```js
const modelBuilder = require("carmi/loader!./model.carmi.js");
// modelBuilder is the carmi builder function!
```
