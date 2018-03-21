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

    const blockedGrouped = mapValues(
      func(filterBy(func(eq(get('blockedBy', arg0), context)), todos, arg1)),
      pendingTodos
    );

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
