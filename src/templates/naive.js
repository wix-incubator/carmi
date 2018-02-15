function mapValues($model, arg0, arg1) {
  return Object.keys(arg1).reduce((acc, key) => {
    acc[key] = arg0($model, arg1[key]);
    return acc;
  }, {});
}

function filterBy($model, arg0, arg1) {
  return Object.keys(arg1).reduce((acc, key) => {
    if (arg0($model, arg1[key])) {
      acc[key] = arg1[key];
    }
    return acc;
  }, {});
}

function groupBy($model, arg0, arg1) {
  return Object.keys(arg1).reduce((acc, key) => {
    const newKey = arg0($model, arg1[key]);
    acc[newKey] = acc[newKey] || [];
    acc[newKey].push(arg1[key]);
    return acc;
  }, {});
}

function mapKeys($model, arg0, arg1) {
  return Object.keys(arg1).reduce((acc, key) => {
    const newKey = arg0($model, arg1[key]);
    acc[newKey] = arg1[key];
    return acc;
  }, {});
}
