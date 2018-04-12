const {
  currentValues,
  compile,
  and,
  or,
  not,
  get,
  root,
  mapValues,
  filterBy,
  mapKeys,
  groupBy,
  func,
  arg0,
  arg1,
  context,
  Expr,
  Setter,
  Expression
} = require('./index');

const naive = process.argv[2] === 'naive';

function TodosModel() {
  const todos = root.get('todos');
  const pendingTodos = todos.filterBy(arg0.get('done').not());
  const blockedBy = todos.mapValues(arg0.get('blockedBy'));
  const todosDone = todos.mapValues(arg0.get('done'));
  const isBlocked3 = blockedBy.mapValues(pendingTodos.get(arg0));
  const canBeWorkedOn = todos.mapValues(
    and(arg0.get('done').not(), or(arg0.get('blockedBy').not(), todosDone.get(arg0.get('blockedBy'))))
  );
  const blockedGrouped = pendingTodos.mapValues(todos.filterBy(arg0.get('blockedBy').eq(context), arg1));

  return {
    canBeWorkedOn,
    pendingTodos,
    blockedGrouped,
    setTodo: Setter('todos', arg0)
  };
}

const todosModel = TodosModel();
console.log(JSON.stringify(todosModel, null, 2));
const source = compile(todosModel, naive);

try {
  require('fs').writeFileSync('./tmp.js', source);
  const modelFunction = eval(source);
  const inst = modelFunction({
    todos: {
      1: { text: '1', done: false, blockedBy: '2' },
      2: { text: '2', done: true },
      3: { text: '3', done: false, blockedBy: '1' }
    },
    showCompleted: false,
    currentTask: 1
  });
  console.log(JSON.stringify(currentValues(inst), null, 2));
  inst.setTodo(1, { ...inst.$model.todos['1'], done: true });
  console.log(JSON.stringify(currentValues(inst), null, 2));
  inst.setTodo(2, { ...inst.$model.todos['2'], done: false });
  console.log(JSON.stringify(currentValues(inst), null, 2));
} catch (e) {
  console.log(e);
}
