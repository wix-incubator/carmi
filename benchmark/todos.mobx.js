const mobx = require('mobx');
function todosMobx(initialState) {
  const todosMap = mobx.observable.object(initialState.todos, {}, { deep: false });
  const canBeWorkedOn = {};
  const todosDone = {};
  const canBeWorkedOnComputeds = {};
  Object.keys(initialState.todos).forEach(idx => {
    todosDone[idx] = mobx.computed(() => todosMap[idx].done);
  });
  mobx.runInAction(() => {
    Object.keys(initialState.todos).forEach(idx => {
      canBeWorkedOnComputeds[idx] = mobx.autorun(() => {
        const item = todosMap[idx];
        const result = !item.done && (item.blockedBy === null || todosDone[item.blockedBy].get());
        canBeWorkedOn[idx] = result;
      });
    });
  });
  return {
    canBeWorkedOn,
    setTodo: (idx, todo) => {
      todosMap[idx] = todo;
    },
    $runInBatch: callback => {
      mobx.runInAction(callback);
    }
  };
}

module.exports = todosMobx;
