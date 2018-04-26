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
  val,
  key,
  arg0,
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
    const pendingTodos = todos.filterBy(val.get('done').not());
    const blockedBy = todos.mapValues(val.get('blockedBy'));
    const todosDone = todos.mapValues(val.get('done'));
    const isNotDone = and(
      val,
      todos
        .get(val)
        .get('done')
        .not()
    );
    const isNotDone2 = and(val, todosDone.get(val).not());
    const isNotDone3 = pendingTodos.get(val);
    const isBlocked = blockedBy.mapValues(isNotDone);
    const isBlocked2 = blockedBy.mapValues(isNotDone2);
    const isBlocked3 = blockedBy.mapValues(isNotDone3);
    const canItemBeWorkedOn = and(
      val.get('done').not(),
      or(val.get('blockedBy').not(), todosDone.get(val.get('blockedBy')))
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

    const blockedGrouped = pendingTodos.mapValues(todos.filterBy(val.get('blockedBy').eq(context), key));

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
    const initialState = {
      todos: generateTestTodoItems(countItems),
      currentTask: '1',
      showCompleted: false
    };
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
      expect(currentValues(naive)).toEqual(currentValues(opt));
    });
  });
});
describe('simple tests', () => {
  it('test any', () => {
    const model = {
      anyTruthy: root.any(val),
      set: Setter(arg0)
    };
    const optModel = eval(compile(model));
    const inst = optModel(new Array(5));
    expect(inst.anyTruthy).toEqual(false);
    inst.set(3, true);
    expect(inst.anyTruthy).toEqual(true);
    inst.set(4, true);
    expect(inst.anyTruthy).toEqual(true);
    inst.set(3, false);
    expect(inst.anyTruthy).toEqual(true);
    inst.set(4, false);
    expect(inst.anyTruthy).toEqual(false);
    console.log(inst);
  });
});
