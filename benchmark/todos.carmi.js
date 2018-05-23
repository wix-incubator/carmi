const { and, or, root, arg0, Setter } = require('../index');

function TodosModel() {
  const todos = root.get('todos');
  const todosDone = todos.mapValues(item => item.get('done'));
  const canBeWorkedOn = todos.mapValues(item =>
    and(item.get('done').not(), or(item.get('blockedBy').not(), todosDone.get(item.get('blockedBy'))))
  );
  return {
    setTodo: Setter('todos', arg0),
    canBeWorkedOn
  };
}
module.exports = TodosModel();
