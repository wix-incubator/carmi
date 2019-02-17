const {
  Expr,
  Token,
  Setter,
  Expression,
  SetterExpression,
  SpliceSetterExpression,
  TokenTypeData,
  SourceTag,
  Clone
} = require('./lang');
const _ = require('lodash');
const OptimizingCompiler = require('./optimizing-compiler');
const {exprHash} = require('./expr-hash')
const {
  pathMatches,
  topologicalSortGetters,
} = require('./expr-tagging');

const tokenTypes = Object.keys(TokenTypeData)

class ByteCodeCompiler extends OptimizingCompiler {
  constructor(model, options) {
    super(model, options);
  }

  generateTree(expr) {
    if (expr instanceof SetterExpression) {
      return {
        type: expr instanceof SpliceSetterExpression ? 'splice' : 'setter',
        path: _.map(expr, entry => (entry instanceof Token ? ({type: entry.$type}) : ({type: 'primitive', value: entry})))
      }
    }

    const currentToken = expr instanceof Expression ? expr[0] : expr
    if (!(currentToken instanceof Token)) {
      return {
        type: 'primitive',
        value: currentToken
      }
    }
    const {$id, $path, $duplicate, $trackedExpr, $type, $invalidates, $tracked, $funcId} = currentToken;
    const source = this.options.debug && this.shortSource(currentToken[SourceTag])
    const parameters = this.generateTreeParametersByType(expr, $type)
    return {
      type: $type,
      ...Object.keys(parameters).length ? parameters : {},
      $: {
          ...(_.isEmpty($path) ? {} : {dependants: _.map([...$path], ([condition, path]) => ({
            condition: _.map(condition, this.generateTree.bind(this)),
            path: _.map(path, this.generateTree.bind(this))
          }))}),
          ...$trackedExpr ? {predicateExpression: this.generateTree($trackedExpr)} : {},
          ...$id ? {id: $id} : {},
          ...$funcId ? {funcId: $funcId} : {},
          ...source ? {source} : {},
          ...$tracked ? {tracked: $tracked} : {},
          ...$duplicate ? {duplicate: $duplicate} : {},
          ...$invalidates ? {invalidates: true} : {}
      }
    }
  }

  generateTreeParametersByType(expr, type) {
    const branches = expr instanceof Expression && expr.slice(1).map(e => this.generateTree(e))
    switch (type) {
      case 'get':
        return {
          object: branches[1],
          prop: branches[0]
        }
      case 'or':
      case 'and':
        return {
          conditions: branches
        }
      case 'ternary':
        return {
          condition: branches[0],
          consequence: branches[1],
          alternate: branches[2]
        }
      case 'object':
        return {entries: _(expr).slice(1).chunk(2).map(([k, v]) => [k, this.generateTree(v)]).value()}
      case 'array':
        return {
          values: branches
        }
      case 'call':
      case 'effect':
      case 'bind':
        return {
          name: expr[1],
          args: branches.slice(1)
        }
      case 'range':
        return {start: branches[0], end: branches[1] || null, step: branches[2] || null}
      case 'filterBy':
      case 'mapValues':
      case 'groupBy':
      case 'map':
      case 'filter':
      case 'mapKeys':
      case 'any':
      case 'keyBy':
      case 'anyValues':
      case 'recursiveMap':
      case 'recursiveMapValues':
        return {
          predicate: branches[0],
          value: branches[1],
          context: branches[2] || null
        }
      case 'recur':
        return {
          loop: branches[0],
          key: branches[1]
        }
      case 'invoke':
        return {
          name: expr[1]
        }
      case 'quote':
      case 'not':
      case 'trace':
      case 'breakpoint':
      case 'isArray':
      case 'boolean':
      case 'isNumber':
      case 'isString':
      case 'isUndefined':
      case 'toUpperCase':
      case 'toLowerCase':
      case 'stringLength':
      case 'floor':
      case 'ceil':
      case 'round':
      case 'cond':
      case 'func':
        return {
          value: branches[0]
        }
      case 'eq':
      case 'lt':
      case 'lte':
      case 'gt':
      case 'gte':
      case 'plus':
      case 'minus':
      case 'mult':
      case 'div':
      case 'mod':
        return {
          value: branches[0],
          other: branches[1]
        }
      case 'parseInt':
        return {
          value: branches[0],
          base: branches[1] || null
        }
      case 'startsWith':
      case 'endsWith':
        return {
          value: branches[0],
          searchString: branches[1]
        }
      case 'split':
        return {
          value: branches[0],
          delimiter: branches[1]
        }
      default:
        return {}
    }
  }

  get template() {
    return require('./templates/bytecode.js');
  }

  ast() {
    const tree = JSON.stringify(_.mapValues({getters: this.getters, setters: this.setters}, 
      t => _.mapValues(t, e => this.generateTree(e))))
    return tree
  }

  topLevelOverrides() {
    return Object.assign({}, super.topLevelOverrides(), {
      AST: () => this.ast(),
      ALL_EXPRESSIONS: () => 'buildByteCode($byteCode)',
      DERIVED: () => 'derive()',
      SETTERS: () => ''});
  }

  buildByteCode() {
    const getters = {}
    const primitives = {}
    
    const serializeDependants = deps => {
      if (!deps) {
        return []
      }

      return [...deps].map(([path, condition]) => ([
        serializeExpression(condition),
        path.map(serializeExpression)
      ]))
    }

    const fixExpression = expr => {
      const token = expr instanceof Token ? expr : expr[0]
      switch (token.$type) {
        case 'get':
          if (expr[2] instanceof Token && expr[2].$type === 'topLevel') {
            return Expr(token, this.topLevelToIndex(expr[1]), expr[2])
          }
          break
        default:
      }
      return expr
    }

    const serializeExpression = e => {
      const hash = exprHash(e)
      if (!(e instanceof Expression) && !(e instanceof Token)) {
        primitives[hash] = e
        return {table: 0, $$ref: hash}
      }

      const expr = fixExpression(e)
      const token = expr instanceof Token ? expr : expr[0]

      const source = this.shortSource(token[SourceTag])
      const sourceHash = source ? exprHash(source) : null
      if (source) {
        primitives[sourceHash] = source
      }

      getters[hash] = getters[hash] || [
        tokenTypes.indexOf(token.$type),
        expr instanceof Expression ? Expr(...expr.slice(1)).map(serializeExpression) : null,
        [
          token.$invalidates,
          serializeDependants(token.$path),
          token.$trackingExpr
        ],
        [
          {table: 0, $$ref: sourceHash}
        ]
      ]
      
    
      return {table: 1, $$ref: hash} 
    }

    const topLevelsRaw = _.mapValues(this.getters, e => serializeExpression(e).$$ref)
    const settersRaw = _.mapValues(this.setters, s => s.slice(1).map(serializeExpression))
    const expressionHashes = Object.keys(getters)
    const primitiveHashes = Object.keys(primitives)
    const topLevels = _.mapValues(topLevelsRaw, ref => expressionHashes.indexOf(ref))
    const hashes = {0: primitiveHashes, 1: expressionHashes}
    const packRef = (table, index) => (table << 24) | index

    const resolveRef = possibleRef => _.has(possibleRef, '$$ref') ? packRef(possibleRef.table, hashes[possibleRef.table].indexOf(possibleRef.$$ref)) : resolveExpressionIndices(possibleRef)
    const resolveExpressionIndices = expression => {
      if (_.isArray(expression)) {
        return _.map(expression, resolveRef)
      }
      if (_.isObject(expression)) {
        return _.mapValues(expression, resolveRef)
      }

      return expression
    }
    const sortedTopLevelNames = topologicalSortGetters(this.getters)
      .filter(name => this.getters[name][0].$type !== 'func')
    const sortedTopLevels = sortedTopLevelNames.map(name => ({name, index: this.topLevelToIndex(name), expression: topLevels[name]}))

    return {
      tokenTypes,
      topLevels: sortedTopLevels,
      getters: Object.values(getters).map(resolveExpressionIndices),
      setters: _.mapValues(settersRaw, setter => [setter instanceof SpliceSetterExpression ? 1 : 0, ...setter.map(resolveRef)]),
      primitives: Object.values(primitives)
    }
  }

  compile() {
    const code = `$byteCode => (${super.compile()})`
    if (this.options.deferByteCodeInjection) {
      return code
    } else {
      return `(${code})(${JSON.stringify(this.buildByteCode(), null, 4)})`
    }
  }

  buildExprFunctionsByTokenType(acc, expr) {
    const tokenType = expr[0].$type;
    if (expr[0].$duplicate) {
      return;
    }
    switch (tokenType) {
      case 'object':
        if (this.isStaticObject(expr)) {
          this.appendExpr(acc, tokenType, expr, `${tokenType}$${expr[0].$id}`);
        }
        break;
      default:
        super.buildExprFunctionsByTokenType(acc, expr);
    }
  }

  buildSetter(setterExpr, name) {
    const args = setterExpr
      .slice(1)
      .filter(t => typeof t !== 'string' && typeof t !== 'number')
      .map(t => t.$type);
    const invalidate = new Array(setterExpr.length - 1)
      .fill()
      .map(
        (v, idx) =>
        `triggerInvalidations(${this.pathToString(setterExpr, idx + 1)}, ${this.generateExpr(
            setterExpr[setterExpr.length - idx - 1]
          )}, ${idx === 0});`
      )
      .join('');

    if (setterExpr instanceof SpliceSetterExpression) {
      return `${name}:$setter.bind(null, (${args.concat(['len', '...newItems']).join(',')}) => {
          const arr = ${this.pathToString(setterExpr, 1)};
          const origLength = arr.length;
          const end = len === newItems.length ? key + len : Math.max(origLength, origLength + newItems.length - len);
          for (let i = key; i < end; i++ ) {
            triggerInvalidations(arr, i, true);
          }
          ${invalidate}
          ${this.pathToString(setterExpr, 1)}.splice(key, len, ...newItems);
      })`;
    }
    return `${name}:$setter.bind(null, (${args.concat('value').join(',')}) => {
              ${invalidate}
              if (typeof value === 'undefined') {
                delete ${this.pathToString(setterExpr)}
              } else {
                ${this.pathToString(setterExpr)}  = value;
              }
          })`;
  }

  invalidates(expr) {
    return expr[0].$invalidates;
  }

  pathOfExpr(expr) {
    return [new Token('topLevel'), expr[0].$rootName].concat(
      new Array(Math.min(expr[0].$depth, 1)).fill(new Token('key'))
    );
  }

  tracking(expr) {
    const tracks = [];
    // tracks.push(`// invalidates - ${this.invalidates(expr)}`)
    const pathsThatInvalidate = expr[0].$path;
    if (pathsThatInvalidate) {
      //console.log(pathsThatInvalidate);
      pathsThatInvalidate.forEach((cond, invalidatedPath) => {
        // tracks.push(
        //   `// invalidatedPath: ${JSON.stringify(invalidatedPath)}, ${JSON.stringify(cond)}, ${
        //     invalidatedPath[invalidatedPath.length - 1].$type
        //   }`
        // );
        const precond = cond ? `(${this.generateExpr(cond)} ) && ` : '';
        if (invalidatedPath[0].$type === 'context') {
          const activePath = [0].concat(invalidatedPath.slice(1));
          tracks.push(
            `${precond} trackPath($tracked, [context, ${activePath
              .map(fragment => this.generateExpr(fragment))
              .join(',')}]);`
          );
        } else if (invalidatedPath.length > 1 && invalidatedPath[0].$type === 'topLevel') {
          tracks.push(
            `${precond} trackPath($tracked, [${invalidatedPath
              .map((fragment, index) => index === 1 ? this.topLevelToIndex(fragment): this.generateExpr(fragment))
              .join(',')}]);`
          );
        } else if (invalidatedPath.length > 1 &&
          (invalidatedPath[0] instanceof Expression && invalidatedPath[0][0].$type === 'invoke')) {
          tracks.push(
            `${precond} trackPath($tracked, [${invalidatedPath
              .map(fragment =>  this.generateExpr(fragment))
              .join(',')}]);`
          );
        } else if (invalidatedPath[0].$type === 'root' && invalidatedPath.length > 1) {
          let settersMatched = Object.values(this.setters).filter(setter => pathMatches(invalidatedPath, setter));
          if (settersMatched.length) {
            // settersMatched.forEach(setter => tracks.push(`// path matched ${JSON.stringify(setter)}`));
            tracks.push(
              `${precond} trackPath($tracked, [${invalidatedPath
                .map(fragment => this.generateExpr(fragment))
                .join(',')}]);`
            );
          }
        }
        //tracks.push(`// tracking ${JSON.stringify(invalidatedPath)}`);
      });
    }
    return tracks.join('\n');
  }
}

module.exports = ByteCodeCompiler;
