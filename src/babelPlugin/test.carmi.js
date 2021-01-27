// @carmi

const {root, chain} = require('../../index');
const first = root.get(0);
const sum = root.call('sum');

const map = root.keyBy((value) => chain('index-').plus(value)).mapValues((value) => value.plus(1))
module.exports = {first, sum, map};
