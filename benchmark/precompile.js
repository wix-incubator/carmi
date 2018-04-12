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
} = require('../index');

const fs = require('fs');
const path = require('path');

function TodosModel() {
  const todos = root.get('todos');
  const todosDone = todos.mapValues(arg0.get('done'));
  const canItemBeWorkedOn = and(
    arg0.get('done').not(),
    or(arg0.get('blockedBy').not(), todosDone.get(arg0.get('blockedBy')))
  );
  const canBeWorkedOn = todos.mapValues(canItemBeWorkedOn);
  return {
    setTodo: Setter('todos', arg0),
    canBeWorkedOn
  };
}

const MODELS = {
  'todos-opt': TodosModel()
};
Object.keys(MODELS).forEach(name => {
  const source = compile(MODELS[name]);
  fs.writeFileSync(path.resolve(__dirname, 'generated', name + '.js'), `module.exports = ${source}`);
});
