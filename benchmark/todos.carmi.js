const { and, or, root, arg0, setter } = require('../index');

function TodosModel() {
  const todos = root.get('todos');
  const todosDone = todos.mapValues(item => item.get('done'));
  const canBeWorkedOn = todos.mapValues(item =>
    item.get('done').ternary(false, item.get('blockedBy').ternary(todosDone.get(item.get('blockedBy')), true))
  );
  return {
    setTodo: setter('todos', arg0),
    canBeWorkedOn
  };
}
module.exports = TodosModel();
