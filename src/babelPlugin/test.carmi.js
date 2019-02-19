// @carmi

const {root} = require('../../index');
module.exports = {first: root.get(0), sum: root.call('sum')};
