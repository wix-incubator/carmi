const {
  currentValues,
  compile,
  and,
  or,
  not,
  eq,
  context,
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

const randomInt = (function Alea(seed) {
  if (seed === undefined) {
    seed = +new Date() + Math.random();
  }
  function Mash() {
    var n = 4022871197;
    return function(r) {
      for (var t, s, u = 0, e = 0.02519603282416938; u < r.length; u++)
        (s = r.charCodeAt(u)),
          (f = e * (n += s) - ((n * e) | 0)),
          (n = 4294967296 * ((t = f * ((e * n) | 0)) - (t | 0)) + (t | 0));
      return (n | 0) * 2.3283064365386963e-10;
    };
  }
  return (function() {
    var m = Mash(),
      a = m(' '),
      b = m(' '),
      c = m(' '),
      x = 1,
      y;
    (seed = seed.toString()), (a -= m(seed)), (b -= m(seed)), (c -= m(seed));
    a < 0 && a++, b < 0 && b++, c < 0 && c++;
    return function(range) {
      var y = x * 2.3283064365386963e-10 + a * 2091639;
      (a = b), (b = c);
      return Math.floor((c = y - (x = y | 0)) * range);
    };
  })();
})(234234);

describe('simple todo', () => {
  function TodosModel() {
    const todos = root.get('todos');
    const pendingTodos = todos.filterBy(arg0.get('done').not());
    const blockedBy = todos.mapValues(arg0.get('blockedBy'));
    const todosDone = todos.mapValues(arg0.get('done'));
    const isNotDone = and(
      arg0,
      todos
        .get(arg0)
        .get('done')
        .not()
    );
    const isNotDone2 = and(arg0, todosDone.get(arg0).not());
    const isNotDone3 = pendingTodos.get(arg0);
    const isBlocked = blockedBy.mapValues(isNotDone);
    const isBlocked2 = blockedBy.mapValues(isNotDone2);
    const isBlocked3 = blockedBy.mapValues(isNotDone3);
    const canItemBeWorkedOn = and(
      arg0.get('done').not(),
      or(arg0.get('blockedBy').not(), todosDone.get(arg0.get('blockedBy')))
    );
    const canBeWorkedOn = todos.mapValues(canItemBeWorkedOn);

    const shownTodo = or(and(root.get('showCompleted'), canBeWorkedOn), pendingTodos);

    const currentTask = root.get('currentTask');
    const currentTaskTodo = todos.get(currentTask);
    const statusOfCurrentTask = or(
      and(currentTaskTodo.get('done'), 'done'),
      and(isBlocked.get(currentTask), 'blocked'),
      'not done'
    );

    const blockedGrouped = pendingTodos.mapValues(todos.filterBy(arg0.get('blockedBy').eq(context), arg1));

    return {
      isBlocked,
      isBlocked2,
      isBlocked3,
      blockedBy,
      canBeWorkedOn,
      shownTodo,
      pendingTodos,
      blockedGrouped,
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
      blockedBy: randomInt(4) === 2 ? '' + (idx + randomInt(countItems - 1)) % countItems : false
    };
  }

  function generateTestTodoItems(count) {
    const res = {};
    for (let idx = 0; idx < count; idx++) {
      res['' + idx] = randomTodoItem(idx);
    }
    return res;
  }

  it('compare naive and optimized', () => {
    const naiveFunc = eval(compile(TodosModel(), true));
    const optFunc = eval(compile(TodosModel()));
    const initialState = { todos: generateTestTodoItems(countItems), currentTask: '1', showCompleted: false };
    require('fs').writeFileSync(
      'junk.js',
      `const model = require('./tmp.js');
const { currentValues } = require('./index');
const inst = model(${JSON.stringify(initialState, null, 2)});`
    );
    console.log(initialState);
    const naive = naiveFunc(initialState);
    const opt = optFunc(initialState);
    expect(currentValues(naive)).toEqual(currentValues(opt));
    const actionTypes = [
      () => {
        const idx = randomInt(countItems);
        const todoItem = randomTodoItem(idx);
        return inst => {
          inst.setTodo('' + idx, todoItem);
          return `inst.setTodo('${idx}', ${JSON.stringify(todoItem)});`;
        };
      },
      () => {
        const current = randomInt(countItems);
        return inst => {
          inst.setCurrentTask(current);
          return `inst.setCurrentTask(${current});`;
        };
      },
      () => {
        const show = randomInt(2) === 1;
        return inst => {
          inst.setShowCompleted(show);
          return `inst.setShowCompleted(${show})`;
        };
      }
    ];
    new Array(countItems * 10).fill().forEach((__, idx) => {
      const action = actionTypes[randomInt(actionTypes.length)]();
      action(naive);
      const actionDesc = action(opt);
      console.log(actionDesc);
      require('fs').appendFileSync('junk.js', '\n' + actionDesc);
      require('fs').writeFileSync('tmp-opt.json', JSON.stringify(currentValues(opt), null, 2));
      require('fs').writeFileSync('tmp-naive.json', JSON.stringify(currentValues(naive), null, 2));
      expect(currentValues(naive)).toEqual(currentValues(opt));
    });
  });
});
