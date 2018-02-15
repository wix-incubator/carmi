function generateTestTodoItems(count) {
  const res = {};
  for (let idx = 0; idx < count; idx++) {
    res[idx] = { text: `todo_${idx}`, done: idx % 3 === 0, blockedBy: idx % 4 === 3 ? '' + (idx - 2) : null };
  }
  return res;
}

function benchmark(count, callback) {
  for (let idx = 0; idx < count; idx++) {
    callback(idx, { text: `todo_${idx}`, done: idx % 2 === 0, blockedBy: idx % 5 > 3 ? '' + (idx - 1) : null });
  }
}

module.exports = { generateTestTodoItems, benchmark };
