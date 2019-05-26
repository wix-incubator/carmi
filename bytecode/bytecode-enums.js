

module.exports.$and = 0;
module.exports.$or = 1;
module.exports.$ternary = 2;
module.exports.$andTracked = 3;
module.exports.$orTracked = 4;
module.exports.$ternaryTracked = 5;
module.exports.$array = 6;
module.exports.$object = 7;
module.exports.$not = 8;
module.exports.$trace = 9;
module.exports.$get = 10;
module.exports.$mapValues = 11;
module.exports.$map = 12;
module.exports.$recursiveMapValues = 13;
module.exports.$recursiveMap = 14;
module.exports.$any = 15;
module.exports.$keyBy = 16;
module.exports.$filter = 17;
module.exports.$anyValues = 18;
module.exports.$filterBy = 19;
module.exports.$mapKeys = 20;
module.exports.$groupBy = 21;
module.exports.$values = 22;
module.exports.$keys = 23;
module.exports.$flatten = 24;
module.exports.$size = 25;
module.exports.$sum = 26;
module.exports.$range = 27;
module.exports.$assign = 28;
module.exports.$defaults = 29;
module.exports.$recur = 30;
module.exports.$func = 31;
module.exports.$invoke = 32;
module.exports.$eq = 33;
module.exports.$gt = 34;
module.exports.$lt = 35;
module.exports.$gte = 36;
module.exports.$lte = 37;
module.exports.$plus = 38;
module.exports.$minus = 39;
module.exports.$mult = 40;
module.exports.$div = 41;
module.exports.$mod = 42;
module.exports.$breakpoint = 43;
module.exports.$call = 44;
module.exports.$bind = 45;
module.exports.$effect = 46;
module.exports.$startsWith = 47;
module.exports.$endsWith = 48;
module.exports.$toUpperCase = 49;
module.exports.$toLowerCase = 50;
module.exports.$stringLength = 51;
module.exports.$floor = 52;
module.exports.$ceil = 53;
module.exports.$round = 54;
module.exports.$parseInt = 55;
module.exports.$substring = 56;
module.exports.$split = 57;
module.exports.$isUndefined = 58;
module.exports.$isBoolean = 59;
module.exports.$isString = 60;
module.exports.$isNumber = 61;
module.exports.$isArray = 62;
module.exports.$quote = 63;
module.exports.$trackPath = 64;
module.exports.VerbsCount = 65;
module.exports.Verbs = {
  $and: 0,
  $or: 1,
  $ternary: 2,
  $andTracked: 3,
  $orTracked: 4,
  $ternaryTracked: 5,
  $array: 6,
  $object: 7,
  $not: 8,
  $trace: 9,
  $get: 10,
  $mapValues: 11,
  $map: 12,
  $recursiveMapValues: 13,
  $recursiveMap: 14,
  $any: 15,
  $keyBy: 16,
  $filter: 17,
  $anyValues: 18,
  $filterBy: 19,
  $mapKeys: 20,
  $groupBy: 21,
  $values: 22,
  $keys: 23,
  $flatten: 24,
  $size: 25,
  $sum: 26,
  $range: 27,
  $assign: 28,
  $defaults: 29,
  $recur: 30,
  $func: 31,
  $invoke: 32,
  $eq: 33,
  $gt: 34,
  $lt: 35,
  $gte: 36,
  $lte: 37,
  $plus: 38,
  $minus: 39,
  $mult: 40,
  $div: 41,
  $mod: 42,
  $breakpoint: 43,
  $call: 44,
  $bind: 45,
  $effect: 46,
  $startsWith: 47,
  $endsWith: 48,
  $toUpperCase: 49,
  $toLowerCase: 50,
  $stringLength: 51,
  $floor: 52,
  $ceil: 53,
  $round: 54,
  $parseInt: 55,
  $substring: 56,
  $split: 57,
  $isUndefined: 58,
  $isBoolean: 59,
  $isString: 60,
  $isNumber: 61,
  $isArray: 62,
  $quote: 63,
  $trackPath: 64
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

