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

const MODELS = {
  'todos-opt': TodosModel()
};
Object.keys(MODELS).forEach(name => {
  const source = compile(MODELS[name]);
  fs.writeFileSync(path.resolve(__dirname, 'generated', name + '.js'), `module.exports = ${source}`);
});
