const { root, arg0, chain, setter } = require('../index');

module.exports = {
  idToFullName: root.keyBy(record => record.get('id')).mapValues(record =>
    record
      .get('firstName')
      .plus(' ')
      .plus(record.get('lastName'))
  ),
  indexOfId: root
    .map((record, index) => chain([record.get('id'), index]))
    .keyBy(idIndexTuple => idIndexTuple.get(0))
    .mapValues(idIndexTuple => idIndexTuple.get(1)),
  setLastName: setter(arg0, 'lastName')
};
