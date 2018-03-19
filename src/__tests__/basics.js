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
} = require('../../index');
const _ = require('lodash');

const timers = {};

let seed = 1.2;
function randomInt(range) {
  return Math.floor(Math.abs(Math.sin(seed++ * 10000)) * range);
}

function benchmark(title) {
  if (timers[title]) {
    const res = new Date() - timers[title];
    delete timers[title];
    console.log(title, res);
  } else {
    timers[title] = new Date();
  }
}

describe('simple todo', () => {
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

    return {
      isBlocked,
      isBlocked2,
      isBlocked3,
      blockedBy,
      canBeWorkedOn,
      shownTodo,
      pendingTodos,
      setTodo: Setter('todos', arg0),
      setShowCompleted: Setter('showCompleted'),
      setCurrentTask: Setter('currentTask')
    };
  }
  const countItems = 100;

  function randomTodoItem(idx) {
    return {
      text: `todo_${idx}`,
      done: randomInt(2) === 0,
      blockedBy: randomInt(4) === 0 ? '' + (idx + randomInt(countItems - 1)) % countItems : false
    };
  }

  function generateTestTodoItems(count) {
    const res = {};
    for (let idx = 0; idx < count; idx++) {
      res[idx] = randomTodoItem(idx);
    }
    return res;
  }

  it('compare naive and optimized', () => {
    const naiveFunc = eval(compile(TodosModel(), true));
    const optFunc = eval(compile(TodosModel()));
    const initialState = { todos: generateTestTodoItems(countItems), currentTask: '1', showCompleted: false };
    console.log(initialState);
    const naive = naiveFunc(initialState);
    const opt = optFunc(initialState);
    expect(currentValues(naive)).toEqual(currentValues(opt));
    const actionTypes = [
      () => {
        const idx = randomInt(countItems);
        const todoItem = randomTodoItem(idx);
        return inst => inst.setTodo('' + idx, todoItem);
      },
      () => {
        const current = randomInt(countItems);
        return inst => inst.setCurrentTask(current);
      },
      () => {
        const show = randomInt(2) === 1;
        return inst => inst.setShowCompleted(show);
      }
    ];
    new Array(countItems * 10).fill().forEach((__, idx) => {
      const action = actionTypes[randomInt(actionTypes.length)]();
      action(naive);
      action(opt);
      //   require('fs').writeFileSync('tmp-opt.json', JSON.stringify(currentValues(opt), null, 2));
      //   require('fs').writeFileSync('tmp-naive.json', JSON.stringify(currentValues(naive), null, 2));
      expect(currentValues(naive)).toEqual(currentValues(opt));
    });
  });
});
