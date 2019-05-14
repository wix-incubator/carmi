const {compile, and, or, root, arg0, setter} = require('../../index');
const {currentValues, funcLibrary, expectTapFunctionToHaveBeenCalled, rand, evalOrLoad} = require('../test-utils');

const _ = require('lodash');

describe('simple todo', () => {
  function TodosModel() {
    const todos = root.get('todos');
    const pendingTodos = todos.filterBy(val => val.get('done').not());
    const blockedBy = todos.mapValues(val => val.get('blockedBy'));
    const todosDone = todos.mapValues(val => val.get('done'));
    const isNotDone = val =>
      and(
        val,
        todos
          .get(val)
          .get('done')
          .not()
      );
    const isNotDone2 = val => and(val, todosDone.get(val).not());
    const isNotDone3 = val => pendingTodos.get(val);
    const isBlocked = blockedBy.mapValues(isNotDone);
    const isBlocked2 = blockedBy.mapValues(isNotDone2);
    const isBlocked3 = blockedBy.mapValues(isNotDone3);
    const canItemBeWorkedOn = val =>
      and(val.get('done').not(), or(val.get('blockedBy').not(), todosDone.get(val.get('blockedBy'))));
    const canBeWorkedOn = todos.mapValues(canItemBeWorkedOn);

    const shownTodo = or(and(root.get('showCompleted'), canBeWorkedOn), pendingTodos);

    const currentTask = root.get('currentTask');
    const currentTaskTodo = todos.get(currentTask);
    const statusOfCurrentTask = or(
      and(currentTaskTodo.get('done'), 'done'),
      and(isBlocked.get(currentTask), 'blocked'),
      'not done'
    );

    const blockedGrouped = pendingTodos.mapValues((val, key) =>
      todos.filterBy((val, key, context) => val.get('blockedBy').eq(context), key) //eslint-disable-line no-shadow
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
      setTodo: setter('todos', arg0),
      setShowCompleted: setter('showCompleted'),
      setCurrentTask: setter('currentTask')
    };
  }
  const countItems = 20;

  function randomTodoItem(idx) {
    return {
      text: `todo_${idx}`,
      done: rand.range(2) === 0,
      blockedBy: rand.range(4) === 2 ? `${(idx + rand.range(countItems - 1)) % countItems}` : false
    };
  }

  function generateTestTodoItems(count) {
    const res = {};
    for (let idx = 0; idx < count; idx++) {
      res[`${idx}`] = randomTodoItem(idx);
    }
    return res;
  }

  it('compare naive and optimized', () => {
    const naiveFunc = evalOrLoad(compile(TodosModel(), true));
    const optFunc = evalOrLoad(compile(TodosModel()));
    const initialState = {
      todos: generateTestTodoItems(countItems),
      currentTask: '1',
      showCompleted: false
    };
    const naive = naiveFunc(initialState);
    const opt = optFunc(initialState);
    expect(currentValues(naive)).toEqual(currentValues(opt));
    const actionTypes = [
      () => {
        const idx = rand.range(countItems);
        const todoItem = randomTodoItem(idx);
        return inst => {
          inst.setTodo(`${idx}`, todoItem);
        };
      },
      () => {
        const current = rand.range(countItems);
        return inst => {
          inst.setCurrentTask(current);
        };
      },
      () => {
        const show = rand.range(2) === 1;
        return inst => {
          inst.setShowCompleted(show);
        };
      }
    ];
    new Array(countItems * 10).fill().forEach((__, idx) => {
      const action = actionTypes[rand.range(actionTypes.length)]();
      action(naive);
      action(opt);
      expect(currentValues(naive)).toEqual(currentValues(opt));
    });
  });
});
