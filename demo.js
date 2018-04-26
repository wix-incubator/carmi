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
  val,
  key,
  context,
  arg0,
  Expr,
  Setter,
  Expression
} = require('./index');

const naive = process.argv[2] === 'naive';

function TodosModel() {
  const todos = root.get('todos');
  const pendingTodos = todos.filterBy(val.get('done').not());
  const blockedBy = todos.mapValues(val.get('blockedBy'));
  const todosDone = todos.mapValues(val.get('done'));
  const isBlocked3 = blockedBy.mapValues(pendingTodos.get(val));
  const canBeWorkedOn = todos.mapValues(
    and(val.get('done').not(), or(val.get('blockedBy').not(), todosDone.get(val.get('blockedBy'))))
  );
  const blockedGrouped = pendingTodos.mapValues(todos.filterBy(val.get('blockedBy').eq(context), key));
  const todosDoneText = todos.mapValues(val.get('done').call('toDoneString'));

  return {
    canBeWorkedOn,
    pendingTodos,
    blockedGrouped,
    todosDoneText,
    setTodo: Setter('todos', arg0)
  };
}

const todosModel = TodosModel();
console.log(JSON.stringify(todosModel, null, 2));
const source = compile(todosModel, naive);

try {
  require('fs').writeFileSync('./tmp.js', source);
  const modelFunction = eval(source);
  const inst = modelFunction(
    {
      todos: {
        1: { text: '1', done: false, blockedBy: '2' },
        2: { text: '2', done: true },
        3: { text: '3', done: false, blockedBy: '1' }
      },
      showCompleted: false,
      currentTask: 1
    },
    { toDoneString: s => (s ? 'done' : 'not done') }
  );
  console.log(JSON.stringify(currentValues(inst), null, 2));
  inst.setTodo(1, { ...inst.$model.todos['1'], done: true });
  console.log(JSON.stringify(currentValues(inst), null, 2));
  inst.setTodo(2, { ...inst.$model.todos['2'], done: false });
  console.log(JSON.stringify(currentValues(inst), null, 2));
} catch (e) {
  console.log(e);
}
