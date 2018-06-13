const { Expr, Token, Setter, Expression, SetterExpression, SpliceSetterExpression, TokenTypeData } = require('./lang');
const _ = require('lodash');
const t = require('babel-types');
const NaiveCompiler = require('./naive-compiler');
const { splitSettersGetters, normalizeAndTagAllGetters, findFuncExpr } = require('./expr-tagging');
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');
const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);
const FlowCompiler = require('./flow-compiler');
const {
  extractAllTypeDeclerations,
  flowAnnotationToRustType,
  rustTypeBorrows,
  isHashMap,
  isStruct
} = require('./rust-types');
const noDollar = str => str.replace('$', '_');

const constantsTypeAnnotations = {
  string: 'stringLiteralTypeAnnotation',
  number: 'numberLiteralTypeAnnotation',
  boolean: 'booleanLiteralTypeAnnotation'
};

class RustCompiler extends NaiveCompiler {
  constructor(model, options) {
    const { getters, setters } = splitSettersGetters(model);
    super({ ...model, ...normalizeAndTagAllGetters(getters, setters) }, options);
  }

  buildDerived(name) {
    return `$${name}Build();`;
  }

  classOfToken(token) {
    if (token instanceof Expression) {
      return this.exprAnnotations[token[0].$id];
    } else if (constantsTypeAnnotations[typeof token]) {
      return { type: constantsTypeAnnotations[typeof token] };
    } else if (token.$type === 'root') {
      return this.types['Model'];
    } else if (token.$type === 'val') {
      return this.exprAnnotations[findFuncExpr(this.getters, token.$funcId)[0].$id].params[0].typeAnnotation;
    } else if (token.$type === 'key') {
      return this.exprAnnotations[findFuncExpr(this.getters, token.$funcId)].params[1].typeAnnotation;
    } else if (token.$type === 'topLevel') {
      return this.topLevelType;
    } else if (token.$type && token.$id && this.exprAnnotations[token.$id]) {
      return this.exprAnnotations[token.$id];
    } else {
      throw new Error('tried to classify unknown token ' + JSON.stringify(token));
    }
  }

  resolveToken(token) {
    const raw = this.classOfToken(token);
    if (raw && raw.type === 'GenericTypeAnnotation') {
      return this.types[raw.id.name];
    }
    return raw;
  }

  //self.model.todos.iter().map(|(k, v)|(k.clone(),self.__11(v,&k,None))).collect()

  generateExpr(expr) {
    console.log(JSON.stringify(expr, null, 2));
    const currentToken = expr instanceof Expression ? expr[0] : expr;
    const annotated = [this.resolveToken(expr)].concat(
      expr instanceof Expression ? expr.slice(1).map(this.resolveToken.bind(this)) : []
    );
    const tokenType = currentToken.$type;
    switch (tokenType) {
      case 'func':
        return `Instance::__${currentToken.$id}`;
      case 'root':
        return `model`;
      case 'val':
      case 'key':
      case 'arg0':
      case 'arg1':
      case 'context':
        return `${tokenType}`;
      case 'topLevel':
        return `topLevel`;
      case 'get':
        if (isHashMap(annotated[2])) {
          return `*${this.generateExpr(expr[2])}.get(&${this.generateExpr(expr[1])}${
            annotated[1].type === 'NullableTypeAnnotation' ? '.clone().unwrap()' : ''
          }).unwrap()`;
        } else if (isStruct(annotated[2])) {
          if (annotated[1].type === 'stringLiteralTypeAnnotation') {
            return `${this.generateExpr(expr[2])}.${noDollar(expr[1])}`;
          }
        }
        return `/* unknown get ${JSON.stringify({ expr, annotated }, null, 2)}*/`;
      case 'ternary':
        if (annotated[1].type === 'NullableTypeAnnotation') {
          return `if ${this.generateExpr(expr[1])}.toJsBool() {
            ${this.generateExpr(expr[2])}
          } else {
            ${this.generateExpr(expr[3])}
          }
          `;
        }
        return `/* ${JSON.stringify(annotated)}*/
 if ${this.generateExpr(expr[1])} {${this.generateExpr(expr[2])}} else {${this.generateExpr(expr[3])}}`;
      case 'mapValues':
        return `${this.generateExpr(expr[2])}.iter().map(|(k, v)|(k.clone(),Instance::__${
          expr[1][0].$id
        }(model,topLevel,funcLib,interner, v,k.clone(),None))).collect()`;
      /*case 'and':
        return (
          '(' +
          expr
            .slice(1)
            .map(e => this.generateExpr(e))
            .map(part => `(${part})`)
            .join('&&') +
          ')'
        );
      case 'or':
        return (
          '(' +
          expr
            .slice(1)
            .map(e => this.generateExpr(e))
            .map(part => `(${part})`)
            .join('||') +
          ')'
        );
      case 'not':
        return `!(${this.generateExpr(expr[1])})`;
      case 'ternary':
        return `((${this.generateExpr(expr[1])})?(${this.generateExpr(expr[2])}):(${this.generateExpr(expr[3])}))`;
      case 'array':
        return `[${expr
          .slice(1)
          .map(t => this.generateExpr(t))
          .join(',')}]`;
      case 'object':
        return `{${_.range(1, expr.length, 2)
          .map(idx => `"${expr[idx]}": ${this.generateExpr(expr[idx + 1])}`)
          .join(',')}}`;
      case 'range':
        return `range(${this.generateExpr(expr[1])}, ${expr.length > 2 ? this.generateExpr(expr[2]) : '0'}, ${
          expr.length > 2 ? this.generateExpr(expr[2]) : '1'
        })`;
      case 'keys':
      case 'values':
      case 'assign':
      case 'defaults':
      case 'size':
        return `${tokenType}(${this.generateExpr(expr[1])})`;
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
        return `(${this.generateExpr(expr[1])}) ${nativeOps[tokenType]} (${this.generateExpr(expr[2])})`;
      case 'get':
        return `${this.generateExpr(expr[2])}[${this.generateExpr(expr[1])}]`;
      case 'mapValues':
      case 'filterBy':
      case 'groupBy':
      case 'mapKeys':
      case 'map':
      case 'any':
      case 'filter':
      case 'keyBy':
      case 'anyValues':
      case 'recursiveMap':
      case 'recursiveMapValues':
        return `${tokenType}(${this.generateExpr(expr[1])}, ${this.generateExpr(expr[2])}, ${
          typeof expr[3] === 'undefined' ? null : this.generateExpr(expr[3])
        })`;
      case 'loop':
        return 'loop';
      case 'recur':
        return `${this.generateExpr(expr[1])}(${this.generateExpr(expr[2])})`;
      case 'func':
        return currentToken.$funcId;
      case 'root':
        return '$model';
      case 'null':
      
      case 'topLevel':
        return `$res`;
      case 'call':
        return `$funcLib[${this.generateExpr(expr[1])}](${expr
          .slice(2)
          .map(subExpr => this.generateExpr(subExpr))
          .join(',')})`;*/
      default:
        if (typeof currentToken === 'boolean' || typeof currentToken === 'number') {
          return '' + currentToken;
        }
        return `/*${JSON.stringify(currentToken)}*/`;
    }
  }

  get template() {
    return require('./templates/rust-simple.js');
  }

  async generateAnnotations() {
    const annotationsFile = path.join(__dirname, '..', 'cache', `${this.hash()}.json`);
    console.log(annotationsFile);
    try {
      const annotations = await readFile(annotationsFile);
      this.annotations = JSON.parse(annotations.toString());
      console.log('annotations: found in cache');
    } catch (e) {
      const flowCompiler = new FlowCompiler(Object.assign({}, this.getters, this.setters), this.options);
      await flowCompiler.compile();
      this.annotations = flowCompiler.annotations;
      await writeFile(annotationsFile, JSON.stringify(this.annotations));
      console.log('annotations: not found in cache, generated new');
    }
    return this.annotations;
  }

  topLevelOverrides() {
    return Object.assign({}, super.topLevelOverrides(), {
      NAME: _.upperFirst(this.options.name),
      SETTERS: () => '',
      STRUCTS: () =>
        Object.values(this.types)
          .concat([this.topLevelType])
          .map(
            type => `${flowAnnotationToRustType(type)}
impl JsConvertable for ${type.name} {
  fn toJsBool(&self) -> bool {
      true
  }
}
`
          )
          .join('')
    });
  }
  //      RETURN_TYPE: () => flowAnnotationToRustType(this.exprAnnotations[expr[0].$id])

  exprTemplatePlaceholders(expr, funcName) {
    console.log(JSON.stringify(expr), funcName, this.exprAnnotations[expr[0].$id]);
    const exprAnnotate = this.exprAnnotations[expr[0].$id];
    const currentToken = expr[0].$type;
    return {
      ROOTNAME: noDollar(expr[0].$rootName),
      FUNCNAME: noDollar(funcName),
      EXPR1: () => this.generateExpr(expr[1]),
      EXPR: () => this.generateExpr(expr),
      ID: () => expr[0].$id,
      RETURN: () => flowAnnotationToRustType(currentToken === 'func' ? exprAnnotate.returnType : exprAnnotate),
      ARGS: () =>
        currentToken === 'func'
          ? exprAnnotate.params
              .map(
                param =>
                  `,${param.name.name}: ${rustTypeBorrows(param.typeAnnotation) ? '&' : ''}${flowAnnotationToRustType(
                    param.typeAnnotation
                  )}`
              )
              .join('')
          : ''
    };
  }

  buildDerived(name) {
    const prefix = `self.topLevel.${noDollar(name)} = `;
    return `${prefix} Instance::_${noDollar(name)}(&self.model,&self.topLevel,&self.funcLib,&mut self.interner);`;
  }

  tagTokenAnnotations(expr, name) {
    if (expr instanceof Expression) {
      expr.forEach(child => {
        if (child instanceof Expression && child[0].$type === 'func') {
        }
      });
    }
  }

  async compile() {
    await this.generateAnnotations();
    this.annotations = extractAllTypeDeclerations(this.annotations);
    this.types = this.annotations.types;
    this.exprAnnotations = this.annotations.expr;
    this.topLevelType = {
      name: 'TopLevel',
      type: 'ObjectTypeAnnotation',
      indexers: [],
      properties: _.map(this.getters, (expr, name) => ({
        type: 'ObjectTypeProperty',
        key: {
          type: 'Identifier',
          name: noDollar(name)
        },
        value: this.exprAnnotations[expr[0].$id]
      }))
    };
    _.forEach(this.getters, this.tagTokenAnnotations);
    return super.compile();
  }

  get lang() {
    return 'rust';
  }
}

module.exports = RustCompiler;
