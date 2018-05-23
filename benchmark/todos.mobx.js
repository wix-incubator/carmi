const mobx = require('mobx');
function todosMobx(initialState) {
  const todosMap = mobx.observable.shallowMap(initialState.todos);
  const canBeWorkedOn = {};
  const todosDone = {};
  const canBeWorkedOnComputeds = {};
  mobx.runInAction(() => {
    Object.keys(initialState.todos).forEach(idx => {
      todosDone[idx] = mobx.computed(() => {
        return todosMap.get('' + idx).done;
      });
      canBeWorkedOnComputeds[idx] = mobx.autorun(() => {
        const item = todosMap.get('' + idx);
        const result = !item.done && (item.blockedBy === null || todosDone[item.blockedBy].get());
        canBeWorkedOn[idx] = result;
      });
    });
  });
  return {
    canBeWorkedOn,
    setTodo: (idx, todo) => {
      todosMap.set('' + idx, todo);
    },
    $runInBatch: callback => {
      mobx.runInAction(callback);
    }
  };
}

module.exports = todosMobx;
