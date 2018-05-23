function generateTestTodoItems(count) {
  const res = {};
  for (let idx = 0; idx < count; idx++) {
    res[idx] = { text: `todo_${idx}`, done: idx % 3 === 0, blockedBy: idx % 4 === 3 ? '' + (idx - 2) : null };
  }
  return res;
}

module.exports = {
  getInitialState: count => {
    return { todos: generateTestTodoItems(count) };
  },
  benchmark: (inst, startCount, endCount) => {
    for (let idx = startCount; idx < endCount; idx++) {
      inst.setTodo('' + idx, {
        text: `todo_${idx}`,
        done: idx % 2 === 0,
        blockedBy: idx % 5 > 3 ? '' + (idx - 1) : null
      });
    }
  }
};
