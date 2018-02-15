const mobx = require('mobx');
const { generateTestTodoItems, benchmark } = require('./todos');
const countItems = process.argv[2] ? parseInt(process.argv[2], 10) : 50000;

const initialState = { todos: generateTestTodoItems(countItems) };
console.log('Todos - mobx', countItems);

const todosMap = mobx.observable.shallowObject(initialState.todos);
const canBeWorkedOn = {};
const todosDone = {};
Object.keys(initialState.todos).forEach(idx => {
  todosDone[idx] = mobx.computed(() => {
    return todosMap['' + idx].done;
  });
});
Object.keys(initialState.todos).forEach(idx => {
  mobx
    .computed(() => {
      const item = todosMap[idx];
      const result = !item.done && (item.blockedBy === null || todosDone[item.blockedBy].get());
    })
    .observe(result => {
      canBeWorkedOn[idx] = result;
    }, true);
});
benchmark(countItems / 10, (idx, item) => (todosMap[idx] = item));
// const result = Object.keys(canBeWorkedOn).reduce((acc, idx) => {
//   return acc + (canBeWorkedOn[idx] ? 1 : 0);
// }, 0);
// console.log('result:', result);
