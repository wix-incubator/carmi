const {Expr, Token, TrackPath, Get, Expression} = require('./lang');
const _ = require('lodash');
const SimpleCompiler = require('./simple-compiler');
const {searchExpressions} = require('./expr-search');
const {exprHash} = require('./expr-hash');

const enums = require('./bytecode/bytecode-enums');

// const {flatbuffers} = require('flatbuffers');
// const {CarmiBytecode} = require('../flatbuffers/bytecode_generated');
// const {ValueType} = CarmiBytecode;

const maxInlineNumber = 32767;
const minInlineNumber = 0;

function embeddedVal(type, val) {
  if (typeof type !== 'number' || typeof val !== 'number' || type < 0 || type > enums.nonVerbs) {
    throw new Error(`illegal value, ${type}, ${val}`);
  }
  return (val << 5) + type;
}

function canInlineNumber(val) {
  return val >= minInlineNumber && val < maxInlineNumber;
}

function setToMap(src) {
  const res = new Map();
  src.forEach(val => res.set(val, res.size));
  return res;
}

function str2ab_array(str) {
  if (str.length % 2 === 1) {
    str += ' ';
  }
  const buf = new ArrayBuffer(str.length * 2);
  const bufView = new Uint16Array(buf);
  for (let i = 0; i < str.length; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return bufView;
}

function concatBuffers(...buffers) {
  // buffers = [buffers[0]]
  const offsetsSize = 4 * (buffers.length + 1);
  const totalSize = _.sum(buffers.map(buf => buf.byteLength)) + offsetsSize;
  // console.log('bufferSizes', buffers.map(buf => buf.byteLength));
  const out = new Buffer(totalSize);

  let offset = 4;
  let totalLength = offsetsSize;
  out.writeUInt32LE(offsetsSize, 0);
  for (let i = 0; i < buffers.length; i++) {
    totalLength += buffers[i].byteLength;
    out.writeUInt32LE(totalLength, offset);
    offset += 4;
  }
  buffers.forEach(buf => {
    for (let i = 0; i < buf.length; i++) {
      if (buf instanceof Uint32Array) {
        out.writeUInt32LE(buf[i], offset);
        offset += 4;
      } else {
        out.writeUInt16LE(buf[i], offset);
        offset += 2;
      }
    }
  });
  return out;
}

class BytecodeCompiler extends SimpleCompiler {
  constructor(model, options) {
    options = {...options, disableHelperFunctions: true};
    super(model, options);
    this.realGetters = [];
    this.exprsFromHash = {};
    this.tagToHash = {};
    this.exprsHashToIndex = new Map();
  }
  extractConsts() {
    const stringsSet = new Set();
    stringsSet.add(''); // the zero constant string is the empty string
    const numbersSet = new Set();
    const addConst = t => {
      if (typeof t === 'string') {
        stringsSet.add(t);
      } else if (typeof t === 'number' && !canInlineNumber(t)) {
        numbersSet.add(t);
      }
    };
    Object.keys(this.getters).forEach(t => {
      if (this.options.debug || t[0] !== '$') {
        stringsSet.add(t);
      }
    });
    Object.keys(this.setters).forEach(t => stringsSet.add(t));
    Object.values(this.setters).forEach(setter => setter.forEach(addConst));
    searchExpressions(e => {
      if (e[0].$type === 'get' && e[2] instanceof Token && e[2].$type === 'topLevel') {
        e[1] = this.topLevelToIndex(e[1]);
      }
      e.forEach(addConst);
    }, Object.values(this.getters));
    Object.values(this.setters).forEach(s => s.forEach(addConst));
    this.stringsMap = setToMap(stringsSet);
    this.numbersMap = setToMap(numbersSet);
    this.stringsSet = stringsSet;
    this.numbersSet = numbersSet;
  }
  convertToEmbeddedValue(val) {
    if (typeof val === 'string') {
      return embeddedVal(enums.$stringRef, this.stringsMap.get(val));
    } else if (typeof val === 'number') {
      return canInlineNumber(val) ?
        embeddedVal(enums.$numberInline, val) :
        embeddedVal(enums.$numberRef, this.numbersMap.get(val));
    } else if (typeof val === 'boolean') {
      return embeddedVal(enums.$booleanInline, val ? 1 : 0);
    } else if (val instanceof Token) {
      return embeddedVal(enums[`$${val.$type}`], 0);
    } else if (val instanceof Expression) {
      if (val[0].$type === 'cond') {
        return embeddedVal(enums.$condRef, this.expressionsOffsets[this.expressionsHashToIndex[val[1]]]);
      }
      return embeddedVal(enums.$expressionRef, this.expressionsHashToIndex[exprHash(val)]);
    }
  }
  rewriteCondsToHash(expr) {
    if (!(expr instanceof Expression)) {
      return expr;
    }
    if (expr[0].$type === 'cond') {
      expr[1] = this.tagToHash.hasOwnProperty(expr[1]) ? this.tagToHash[expr[1]] : expr[1];
      return expr;
    }
    return Expr(...expr.map(t => this.rewriteCondsToHash(t)));
  }
  addExpressionsToHashes(exprs) {
    searchExpressions(e => {
      if (!(e instanceof Expression) || e[0].$type === 'cond') {
        return;
      }
      const hash = exprHash(e);
      e[0].$hash = hash;
      this.exprsFromHash[hash] = this.exprsFromHash[hash] || e;
      if (e[0].hasOwnProperty('$id')) {
        this.tagToHash[e[0].$id] = hash;
      }
      // console.log(hash, JSON.stringify(e));
    }, exprs);
  }
  compile() {
    Object.keys(this.getters).forEach(name => {
      const index = this.topLevelToIndex(name);
      if (typeof index === 'number') {
        this.realGetters[index] = name;
      }
    });
    const countTopLevels = this.realGetters.length;

    this.addExpressionsToHashes(Object.values(this.getters));

    this.extractConsts();

    searchExpressions(e => {
      if (!(e instanceof Expression)) {
        return;
      }
      if (!e[0].$path) {
        return;
      }
      const trackParts = Array.from(e[0].$path.entries())
        .filter(([path, cond]) => path[0].$type !== 'val')
        .map(([path, cond]) => {
          const pathAsExpr = path.slice(1).reduce((acc, t) => Expr(Get, t, acc), path[0]);
          const pathHash = exprHash(pathAsExpr);
          // console.log('path', pathHash, this.exprsFromHash.hasOwnProperty(pathHash), pathAsExpr);
          // console.log('cond', cond);
          return [this.rewriteCondsToHash(cond), pathAsExpr];
        });
      e[0].$path = Expr(TrackPath, ...[].concat(...trackParts));
      // console.log(JSON.stringify(e[0].$path))
      this.addExpressionsToHashes([e[0].$path]);
      if (e[0].$type === 'func') {
        e.push(e[0].$path);
      }
    }, Object.values(this.getters));

    Object.keys(this.exprsFromHash).forEach(hash => {
      this.exprsHashToIndex.set(hash, this.exprsHashToIndex.size);
    });

    // console.log(this.exprsHashToIndex.size, stringsSet.size, numbersSet.size, Object.keys(this.getters).length);
    this.expressionsHashToIndex = {};
    Object.keys(this.exprsFromHash).forEach((hash, index) => this.expressionsHashToIndex[hash] = index);

    const stringsAndNumbers = JSON.stringify({
      $strings: Array.from(this.stringsSet),
      $numbers: Array.from(this.numbersSet)
    });
    const constsBuffer = str2ab_array(stringsAndNumbers);
    const countOfTopLevels = Object.keys(this.getters).length;
    const countOfExpressions = Object.keys(this.exprsFromHash).length;
    const lengthOfAllExpressions = _.sum(Object.values(this.exprsFromHash).map(e => e.length));
    const header = new Uint32Array(1);
    header[0] = countOfTopLevels;
    const topLevelNames = new Uint32Array(countOfTopLevels);
    const topLevelExpressions = new Uint32Array(countOfTopLevels);
    const topLevelTracking = new Uint32Array(countOfTopLevels);
    _.range(countTopLevels).forEach(i => {
      let name = '';
      if (this.options.debug || this.realGetters[i][0] !== '$') {
        name = this.realGetters[i];
      }
      topLevelNames[i] = this.stringsMap.get(name);
      const expr = this.getters[this.realGetters[i]];
      topLevelExpressions[i] = this.exprsHashToIndex.get(exprHash(expr));
      // console.log(expr[0].$path, exprHash(expr[0].$path), this.exprsHashToIndex.get(exprHash(expr[0].$path)));
      topLevelTracking[i] = this.exprsHashToIndex.get(exprHash(expr[0].$path));
    });
    // console.log(this.exprsHashToIndex);
    let exprOffset = 0;
    this.expressionsOffsets = new Uint32Array(countOfExpressions);
    Object.keys(this.exprsFromHash).forEach((hash, index) => {
      const e = this.exprsFromHash[hash];
      this.expressionsOffsets[index] = exprOffset;
      exprOffset += e.length;
    });
    const expressions = new Uint32Array(lengthOfAllExpressions);
    // console.log({countOfExpressions, lengthOfAllExpressions, countTopLevels})

    Object.keys(this.exprsFromHash).forEach((hash, index) => {
      exprOffset = this.expressionsOffsets[index];
      const e = this.exprsFromHash[hash];
      const verb = enums[`$${e[0].$type}`] << 16;
      expressions[exprOffset] = verb + e.length;
      // console.log(e[0].$type, expressions[exprOffset], JSON.stringify(e));
      e.slice(1)
        .map(t => this.convertToEmbeddedValue(t))
        .forEach((val, indexInExpr) => {
          expressions[exprOffset + 1 + indexInExpr] = val;
        });
    });

    const settersSize = _.sum(Object.keys(this.setters).map(key => this.setters[key].length + 2));
    const settersBuffer = new Uint32Array(settersSize);
    let settersOffset = 0;
    Object.keys(this.setters).forEach(key => {
      const setter = this.setters[key];
      const type = enums[`$${setter.setterType()}`] << 16;
      settersBuffer[settersOffset++] = type + setter.length;
      settersBuffer[settersOffset++] = this.stringsMap.get(key);
      setter
        .map(v => this.convertToEmbeddedValue(v))
        .forEach(val => {
          settersBuffer[settersOffset++] = val;
        });
    });

    // console.log({
    //   header,
    //   topLevelExpressions,
    //   topLevelNames,
    //   expressionsOffsets,
    //   expressions,
    //   constsBuffer,
    //   lengthOfAllExpressions
    // });
    const outputArray = concatBuffers(
      header,
      topLevelExpressions,
      topLevelNames,
      topLevelTracking,
      this.expressionsOffsets,
      expressions,
      settersBuffer,
      constsBuffer
    );
    return outputArray;
  }
}

module.exports = BytecodeCompiler;
