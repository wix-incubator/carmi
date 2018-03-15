const todosModel = require('./generated/todos-opt');
const { generateTestTodoItems, benchmark } = require('./todos');
const countItems = process.argv[2] ? parseInt(process.argv[2], 10) : 50000;
const countChanges = process.argv[3] ? parseInt(process.argv[3], 10) : countItems / 10;

const initialState = { todos: generateTestTodoItems(countItems) };
console.log('Todos - essential complexity', countItems);

const inst = todosModel(initialState);
benchmark(countChanges, (idx, item) => inst.setTodo('' + idx, item));
// const result = Object.keys(inst.canBeWorkedOn).reduce((acc, idx) => {
//   return acc + (inst.canBeWorkedOn[idx] ? 1 : 0);
// }, 0);
// console.log('result:', result);
