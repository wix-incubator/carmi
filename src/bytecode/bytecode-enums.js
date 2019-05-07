

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
module.exports.$cond = 30;
module.exports.$eq = 31;
module.exports.$gt = 32;
module.exports.$lt = 33;
module.exports.$gte = 34;
module.exports.$lte = 35;
module.exports.$plus = 36;
module.exports.$minus = 37;
module.exports.$mult = 38;
module.exports.$div = 39;
module.exports.$mod = 40;
module.exports.$breakpoint = 41;
module.exports.$call = 42;
module.exports.$bind = 43;
module.exports.$effect = 44;
module.exports.$startsWith = 45;
module.exports.$endsWith = 46;
module.exports.$toUpperCase = 47;
module.exports.$toLowerCase = 48;
module.exports.$stringLength = 49;
module.exports.$floor = 50;
module.exports.$ceil = 51;
module.exports.$round = 52;
module.exports.$parseInt = 53;
module.exports.$substring = 54;
module.exports.$split = 55;
module.exports.$isUndefined = 56;
module.exports.$isBoolean = 57;
module.exports.$isString = 58;
module.exports.$isNumber = 59;
module.exports.$isArray = 60;
module.exports.$quote = 61;
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
  $cond: 30,
  $eq: 31,
  $gt: 32,
  $lt: 33,
  $gte: 34,
  $lte: 35,
  $plus: 36,
  $minus: 37,
  $mult: 38,
  $div: 39,
  $mod: 40,
  $breakpoint: 41,
  $call: 42,
  $bind: 43,
  $effect: 44,
  $startsWith: 45,
  $endsWith: 46,
  $toUpperCase: 47,
  $toLowerCase: 48,
  $stringLength: 49,
  $floor: 50,
  $ceil: 51,
  $round: 52,
  $parseInt: 53,
  $substring: 54,
  $split: 55,
  $isUndefined: 56,
  $isBoolean: 57,
  $isString: 58,
  $isNumber: 59,
  $isArray: 60,
  $quote: 61
};



module.exports.$numberInline = 0;
module.exports.$booleanInline = 1;
module.exports.$stringRef = 2;
module.exports.$numberRef = 3;
module.exports.$expressionRef = 4;
module.exports.$root = 5;
module.exports.$topLevel = 6;
module.exports.$loop = 7;
module.exports.$context = 8;
module.exports.$val = 9;
module.exports.$key = 10;
module.exports.$null = 11;
module.exports.$arg0 = 12;
module.exports.$arg1 = 13;
module.exports.$arg2 = 14;
module.exports.$arg3 = 15;
module.exports.$arg4 = 16;
module.exports.$arg5 = 17;
module.exports.$arg6 = 18;
module.exports.$arg7 = 19;
module.exports.$arg8 = 20;
module.exports.$arg9 = 21;
module.exports.nonVerbsCount = 22;
module.exports.nonVerbs = {
  $numberInline: 0,
  $booleanInline: 1,
  $stringRef: 2,
  $numberRef: 3,
  $expressionRef: 4,
  $root: 5,
  $topLevel: 6,
  $loop: 7,
  $context: 8,
  $val: 9,
  $key: 10,
  $null: 11,
  $arg0: 12,
  $arg1: 13,
  $arg2: 14,
  $arg3: 15,
  $arg4: 16,
  $arg5: 17,
  $arg6: 18,
  $arg7: 19,
  $arg8: 20,
  $arg9: 21
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

