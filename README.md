# CARMI

## Compiler for Automatic Reactive Modelling of Inference

This is a POC of an entirely new approach to modelling infered state, there are 4 classic methods of handling
deriviation of state

1. The naive - compute from scratch everytime the state is changed
2. Handle cache invalidation manually with all the world of hurt that entails.
3. Using Immutable data and caching computation based on the identity of the inputs
4. Using Functional Reactive Programming to box fragments of your state with getters&setters, running deriviations in a
   way that logs which fragments were read during the computation, and invalidate when one of their setters is invoked

This project is an attempt at a new approach, a DSL+Compiler which are fed two types of inputs:

1. The deriviation of state you need
2. The paths in the model you want to write to

The compiler generates JS source code which handles all the reactive cache invalidation automatically

Because the compiler knows in advance all the stuff that can be read/written from/to the model, it can do all sort of
cool stuff that is nearly impossible to do automatically using other approachs

1. Track conditional consumption of parts of the model only if used with zero over head
2. Hoisting shared sub expressions, so they are only calculated once
3. Not track dependencies if there are no setters that can cause the expression to invalidate
4. All computation is incremental

```js
const { compile, root, and, or, arg0, Setter, Splice } = require('./index');
const todosByIdx = root.keyBy('idx');
const anyTodoNotDone = todosByIdx.anyValues(todo => todo.get('done').not());
const todosDisplayByIdx = todosByIdx.mapValues(todo =>
  todo.get('task').plus(or(and(todo.get('done'), ' - done'), ' - not done'))
);
const todosDisplay = root.map(todo => todosDisplayByIdx.get(todo.get('idx')));
const model = {
  todosDisplay,
  anyTodoNotDone,
  setTodoDone: Setter(arg0, 'done'),
  spliceTodos: Splice()
};

const todosModel = eval(compile(model));
const todos = todosModel([
  { idx: '1', done: false, task: 'write a blog post about carmi' },
  { idx: '2', done: true, task: 'publish to npm' },
  { idx: '3', done: false, task: 'write a demo for carmi' }
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
THIS IS A POC - Do not use for production yet
