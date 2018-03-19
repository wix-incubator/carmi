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
  Expr,
  Setter,
  Expression
} = require('./index');

const naive = process.argv[2] === 'naive';

function TodosModel() {
  const todos = get('todos', root);
  const pendingTodos = filterBy(func(not(get('done', arg0))), todos);
  const blockedBy = mapValues(func(get('blockedBy', arg0)), todos);
  const todosDone = mapValues(func(get('done', arg0)), todos);
  const isNotDone = func(and(arg0, not(get('done', get(arg0, todos)))));
  const isNotDone2 = func(and(arg0, not(get(arg0, todosDone))));
  const isNotDone3 = func(get(arg0, pendingTodos));
  const isBlocked = mapValues(isNotDone, blockedBy);
  const isBlocked2 = mapValues(isNotDone2, blockedBy);
  const isBlocked3 = mapValues(isNotDone3, blockedBy);
  const canItemBeWorkedOn = func(
    and(not(get('done', arg0)), or(not(get('blockedBy', arg0)), get(get('blockedBy', arg0), todosDone)))
  );
  const canBeWorkedOn = mapValues(canItemBeWorkedOn, todos);

  const shownTodo = or(and(get('showCompleted', root), canBeWorkedOn), pendingTodos);

  const currentTask = get('currentTask', root);
  const currentTaskTodo = get(currentTask, todos);

  const statusOfCurrentTask = or(
    and(get('done', currentTaskTodo), 'done'),
    and(get(currentTask, isBlocked), 'blocked'),
    'not done'
  );

  // const mapOfMaps = mapValues(
  //   func(mapValues(func(get('showCompleted', root)), todos)),
  //   todos
  // );

  // console.log({ isBlocked, blockedBy, isNotDone });

  return {
    isBlocked,
    isBlocked2,
    isBlocked3,
    canBeWorkedOn,
    // mapOfMaps,
    shownTodo,
    pendingTodos,
    setTodo: Setter('todos', arg0),
    setShowCompleted: Setter('showCompleted'),
    setCurrentTask: Setter('currentTask'),
    statusOfCurrentTask
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
  inst.setShowCompleted(true);
  console.log(JSON.stringify(currentValues(inst), null, 2));
} catch (e) {
  console.log(e);
}
