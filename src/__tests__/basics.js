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
    const todosDone = mapValues(func(get('done', arg0)), get('todos', root));
    const canItemBeWorkedOn = func(
      and(not(get('done', arg0)), or(not(get('blockedBy', arg0)), get(get('blockedBy', arg0), todosDone)))
    );
    const canBeWorkedOn = mapValues(canItemBeWorkedOn, get('todos', root));
    return {
      setTodo: Setter('todos', arg0),
      canBeWorkedOn
    };
  }

  function generateTestTodoItems(count) {
    const res = {};
    for (let idx = 0; idx < count; idx++) {
      res[idx] = { text: `todo_${idx}`, done: idx % 3 === 0, blockedBy: idx % 4 === 3 ? '' + (idx - 2) : null };
    }
    return res;
  }

  function setTodo(inst, idx, overrides) {
    idx = '' + idx;
    inst.setTodo(idx, { ...inst.$model.todos[idx], ...overrides });
  }

  it('compare naive and optimized', () => {
    const naiveFunc = eval(compile(TodosModel(), true));
    const optFunc = eval(compile(TodosModel()));
    const countItems = 20;
    const initialState = { todos: generateTestTodoItems(countItems) };
    const naive = naiveFunc(initialState);
    const opt = optFunc(initialState);
    expect(currentValues(naive)).toEqual(currentValues(opt));

    new Array(countItems).fill().forEach((__, idx) => {
      const possibleOverrides = [
        { done: false },
        { done: true },
        { blockedBy: '' + (countItems - idx - 1) },
        { blockedBy: null }
      ];
      const override = possibleOverrides[idx % possibleOverrides.length];
      setTodo(naive, idx, override);
      //   expect(currentValues(naive)).not.toEqual(currentValues(opt));
      setTodo(opt, idx, override);
      expect(currentValues(naive)).toEqual(currentValues(opt));
    });
  });
});
