

module.exports.$and = 0;
module.exports.$or = 1;
module.exports.$ternary = 2;
module.exports.$array = 3;
module.exports.$object = 4;
module.exports.$not = 5;
module.exports.$trace = 6;
module.exports.$get = 7;
module.exports.$mapValues = 8;
module.exports.$map = 9;
module.exports.$recursiveMapValues = 10;
module.exports.$recursiveMap = 11;
module.exports.$any = 12;
module.exports.$keyBy = 13;
module.exports.$filter = 14;
module.exports.$anyValues = 15;
module.exports.$filterBy = 16;
module.exports.$mapKeys = 17;
module.exports.$groupBy = 18;
module.exports.$values = 19;
module.exports.$keys = 20;
module.exports.$flatten = 21;
module.exports.$size = 22;
module.exports.$isEmpty = 23;
module.exports.$last = 24;
module.exports.$sum = 25;
module.exports.$range = 26;
module.exports.$assign = 27;
module.exports.$defaults = 28;
module.exports.$recur = 29;
module.exports.$func = 30;
module.exports.$invoke = 31;
module.exports.$eq = 32;
module.exports.$gt = 33;
module.exports.$lt = 34;
module.exports.$gte = 35;
module.exports.$lte = 36;
module.exports.$plus = 37;
module.exports.$minus = 38;
module.exports.$mult = 39;
module.exports.$div = 40;
module.exports.$mod = 41;
module.exports.$breakpoint = 42;
module.exports.$call = 43;
module.exports.$bind = 44;
module.exports.$effect = 45;
module.exports.$startsWith = 46;
module.exports.$endsWith = 47;
module.exports.$toUpperCase = 48;
module.exports.$toLowerCase = 49;
module.exports.$stringLength = 50;
module.exports.$floor = 51;
module.exports.$ceil = 52;
module.exports.$round = 53;
module.exports.$parseInt = 54;
module.exports.$parseFloat = 55;
module.exports.$substring = 56;
module.exports.$split = 57;
module.exports.$isUndefined = 58;
module.exports.$isBoolean = 59;
module.exports.$isString = 60;
module.exports.$isNumber = 61;
module.exports.$isArray = 62;
module.exports.$quote = 63;
module.exports.$trackPath = 64;
module.exports.$join = 65;
module.exports.VerbsCount = 66;
module.exports.Verbs = {
  $and: 0,
  $or: 1,
  $ternary: 2,
  $array: 3,
  $object: 4,
  $not: 5,
  $trace: 6,
  $get: 7,
  $mapValues: 8,
  $map: 9,
  $recursiveMapValues: 10,
  $recursiveMap: 11,
  $any: 12,
  $keyBy: 13,
  $filter: 14,
  $anyValues: 15,
  $filterBy: 16,
  $mapKeys: 17,
  $groupBy: 18,
  $values: 19,
  $keys: 20,
  $flatten: 21,
  $size: 22,
  $isEmpty: 23,
  $last: 24,
  $sum: 25,
  $range: 26,
  $assign: 27,
  $defaults: 28,
  $recur: 29,
  $func: 30,
  $invoke: 31,
  $eq: 32,
  $gt: 33,
  $lt: 34,
  $gte: 35,
  $lte: 36,
  $plus: 37,
  $minus: 38,
  $mult: 39,
  $div: 40,
  $mod: 41,
  $breakpoint: 42,
  $call: 43,
  $bind: 44,
  $effect: 45,
  $startsWith: 46,
  $endsWith: 47,
  $toUpperCase: 48,
  $toLowerCase: 49,
  $stringLength: 50,
  $floor: 51,
  $ceil: 52,
  $round: 53,
  $parseInt: 54,
  $parseFloat: 55,
  $substring: 56,
  $split: 57,
  $isUndefined: 58,
  $isBoolean: 59,
  $isString: 60,
  $isNumber: 61,
  $isArray: 62,
  $quote: 63,
  $trackPath: 64,
  $join: 65
};



module.exports.$numberInline = 0;
module.exports.$booleanInline = 1;
module.exports.$stringRef = 2;
module.exports.$numberRef = 3;
module.exports.$expressionRef = 4;
module.exports.$condRef = 5;
module.exports.$root = 6;
module.exports.$topLevel = 7;
module.exports.$loop = 8;
module.exports.$context = 9;
module.exports.$val = 10;
module.exports.$key = 11;
module.exports.$null = 12;
module.exports.$arg0 = 13;
module.exports.$arg1 = 14;
module.exports.$arg2 = 15;
module.exports.$arg3 = 16;
module.exports.$arg4 = 17;
module.exports.$arg5 = 18;
module.exports.$arg6 = 19;
module.exports.$arg7 = 20;
module.exports.$arg8 = 21;
module.exports.$arg9 = 22;
module.exports.nonVerbsCount = 23;
module.exports.nonVerbs = {
  $numberInline: 0,
  $booleanInline: 1,
  $stringRef: 2,
  $numberRef: 3,
  $expressionRef: 4,
  $condRef: 5,
  $root: 6,
  $topLevel: 7,
  $loop: 8,
  $context: 9,
  $val: 10,
  $key: 11,
  $null: 12,
  $arg0: 13,
  $arg1: 14,
  $arg2: 15,
  $arg3: 16,
  $arg4: 17,
  $arg5: 18,
  $arg6: 19,
  $arg7: 20,
  $arg8: 21,
  $arg9: 22
};



module.exports.$setter = 0;
module.exports.$splice = 1;
module.exports.$push = 2;
module.exports.setterTypesCount = 3;
module.exports.setterTypes = {
  $setter: 0,
  $splice: 1,
  $push: 2
};



// Values are uint32
// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVTTT
// TTT - signifies type
// 000 - number inline
// 001 - boolean inline
// 010 - string ref
// 011 - number ref
// 100 - token
// 101 - expression ref
// the rest of the bits are the value 2^29 possible values

// table Expression {
//     token: Verbs;
//     values: [uint32] (required);
// }

// table Bytecode {
//     topLevels:[uint32] (required);
//     topLevelsNames:[uint32] (required);
//     expressions: [Expression] (required);
//     constant_numbers:[float64] (required);
//     constant_strings:[string] (required);
// }

// root_type Bytecode;
//

