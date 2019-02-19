function generateTestRecords(count) {
  const res = [];
  for (let idx = 0; idx < count; idx++) {
    res[idx] = { id: `person_${idx}`, firstName: `first_${idx}`, lastName: `last_${idx}`};
  }
  return res;
}

module.exports = {
  getInitialState: count => generateTestRecords(count),
  benchmark: (inst, startCount, endCount) => {
    for (let idx = startCount; idx < endCount; idx++) {
      const index = inst.indexOfId[`person_${idx}`]
      inst.setLastName(index, `${inst.$model[index].lastName}!`);
    }
  }
};
