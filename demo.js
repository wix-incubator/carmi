const { compile, root, and, or, arg0, setter, splice } = require('./index');
const todosByIdx = root.keyBy('idx');
const anyTodoNotDone = todosByIdx.anyValues(todo => todo.get('done').not());
const todosDisplayByIdx = todosByIdx.mapValues(todo =>
  todo.get('task').plus(or(and(todo.get('done'), ' - done'), ' - not done'))
);
const todosDisplay = root.map(todo => todosDisplayByIdx.get(todo.get('idx')));
const model = {
  todosDisplay,
  anyTodoNotDone,
  setTodoDone: setter(arg0, 'done'),
  spliceTodos: splice()
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
