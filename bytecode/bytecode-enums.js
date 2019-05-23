

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
module.exports.$sum = 23;
module.exports.$range = 24;
module.exports.$assign = 25;
module.exports.$defaults = 26;
module.exports.$recur = 27;
module.exports.$func = 28;
module.exports.$invoke = 29;
module.exports.$eq = 30;
module.exports.$gt = 31;
module.exports.$lt = 32;
module.exports.$gte = 33;
module.exports.$lte = 34;
module.exports.$plus = 35;
module.exports.$minus = 36;
module.exports.$mult = 37;
module.exports.$div = 38;
module.exports.$mod = 39;
module.exports.$breakpoint = 40;
module.exports.$call = 41;
module.exports.$bind = 42;
module.exports.$effect = 43;
module.exports.$startsWith = 44;
module.exports.$endsWith = 45;
module.exports.$toUpperCase = 46;
module.exports.$toLowerCase = 47;
module.exports.$stringLength = 48;
module.exports.$floor = 49;
module.exports.$ceil = 50;
module.exports.$round = 51;
module.exports.$parseInt = 52;
module.exports.$substring = 53;
module.exports.$split = 54;
module.exports.$isUndefined = 55;
module.exports.$isBoolean = 56;
module.exports.$isString = 57;
module.exports.$isNumber = 58;
module.exports.$isArray = 59;
module.exports.$quote = 60;
module.exports.$trackPath = 61;
module.exports.VerbsCount = 62;
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
  $sum: 23,
  $range: 24,
  $assign: 25,
  $defaults: 26,
  $recur: 27,
  $func: 28,
  $invoke: 29,
  $eq: 30,
  $gt: 31,
  $lt: 32,
  $gte: 33,
  $lte: 34,
  $plus: 35,
  $minus: 36,
  $mult: 37,
  $div: 38,
  $mod: 39,
  $breakpoint: 40,
  $call: 41,
  $bind: 42,
  $effect: 43,
  $startsWith: 44,
  $endsWith: 45,
  $toUpperCase: 46,
  $toLowerCase: 47,
  $stringLength: 48,
  $floor: 49,
  $ceil: 50,
  $round: 51,
  $parseInt: 52,
  $substring: 53,
  $split: 54,
  $isUndefined: 55,
  $isBoolean: 56,
  $isString: 57,
  $isNumber: 58,
  $isArray: 59,
  $quote: 60,
  $trackPath: 61
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

