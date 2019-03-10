const OptimizingCompiler = require("../optimizing-compiler");
import * as rt from "./vm-rt";
import { packPrimitiveIndex, packProjectionHeader, packProjectionIndex } from './vm-rt'
import * as _ from "lodash";
import { exprHash } from "../expr-hash";
import { pathMatches } from "../expr-tagging";

import {
  ProjectionData,
  GetterProjection,
  ProjectionMetaData,
  ProjectionType,
  Reference,
  SetterProjection,
  InvalidationPath,
  TopLevel
} from "./vm-types";
import { Token, Expression, SourceTag, SetterExpression } from "../lang";

interface IntermediateReference {
  ref: string | number
  table: "primitives" | "projections" | "numbers"
}


type MetaDataHash = string;
type PrimitiveHash = string;
type ProjectionHash = string;
interface IntermediateProjection {
  type: string;
  invalidates: boolean
  metaData: number;
  source: string | null;
  args: Reference[];
}

interface IntermediateSource {
  file: string;
  line: number;
  col: number;
}

class VMCompiler extends OptimizingCompiler {
  buildRT() {
    return _.map(rt, (val: any, name: string) => 
        _.isFunction(val) ? val.toString() : `const ${name} = exports.${name} = ${JSON.stringify(val)};`)
      .join("\n");
  }
  topLevelOverrides() {
    return Object.assign({}, super.topLevelOverrides(), {
      SETTERS: ""
    });
  }

  get template() {
    return require("../templates/vm-template.js");
  }

  buildEnvelope() {
    return `
            function buildEnvelope($projectionData, $vmOptions) {
                return ${super.compile()}
            }`;
  }

  buildProjectionData(): ProjectionData {
    function createIndexedMap<T>() {
      const map = new Map<string, [T, number]>()
      return {
        add(value: T) : number {
          const hash = exprHash(value)
          const current = map.get(hash)
          if (current) {
            return current[1]
          }

          const index = map.size
          map.set(hash, [value, index])
          return index
        },

        values() {
          return [...map.values()].map(([value, n]) => value)
        }
      }
    }

    const projectionsMap = createIndexedMap<GetterProjection>()
    const pathMap = createIndexedMap<InvalidationPath>()
    const metaDataMap = createIndexedMap<ProjectionMetaData>()
    metaDataMap.add([])
    const primitiveMap = createIndexedMap<any>()
    primitiveMap.add(false)
    primitiveMap.add(true)
    primitiveMap.add(null)
    primitiveMap.add('')
    
    const astGetters = this.getRealGetters() as string[];
    const generateProjectionFromExpression = (
      expression: Expression | Token
    ): IntermediateProjection => {
      const currentToken: Token =
        expression instanceof Token ? expression : expression[0];
      
      const expressionArgs =
        expression instanceof Expression ? expression.slice(1) : [];

      if (currentToken.$type === 'context') {
        return generateProjectionFromExpression(new Expression(new Token('get'), 0, new Token('rawContext')))
      }

      const type: string = currentToken.$type === 'rawContext' ? 'context' : currentToken.$type;

      const pathsThatInvalidate = currentToken.$path || new Map();
      const paths: Reference[][] = [];
      
      pathsThatInvalidate.forEach(
        (cond: Expression, invalidatedPath: Expression[]) => {
          if (invalidatedPath[0].$type === "context") {
            paths.push([
              cond, new Token('rawContext'), 0, ...invalidatedPath.slice(1)
            ]);
          } else if (
            invalidatedPath.length > 1 &&
            invalidatedPath[0].$type === "topLevel"
          ) {
            paths.push([
              cond, invalidatedPath[0],
                this.topLevelToIndex(invalidatedPath[1]),
                ...invalidatedPath.slice(2)
              ]);
          } else if (
            (invalidatedPath.length > 1 &&
              invalidatedPath[0] instanceof Expression &&
              invalidatedPath[0][0].$type === "get" &&
              invalidatedPath[0][2].$type === "topLevel") ||
            (invalidatedPath[0].$type === "root" &&
              invalidatedPath.length > 1 &&
              Object.values(this.setters).filter(setter =>
                pathMatches(invalidatedPath, setter)
              ).length)
          ) {
            paths.push([cond, ...invalidatedPath]);
          }
        }
      );

      const metaData = paths && paths.length ? metaDataMap.add(paths.map(p => pathMap.add(p.map(serializeProjection)))) : 0

      const prependID = (args: Token[]) => [currentToken.$tracked ? currentToken.$id : -1, ...args];

      const argsManipulators: { [key: string]: (args: Token[]) => any[] } = {
        get: ([prop, obj]: Token[]) => [
          obj,
          obj instanceof Token && obj.$type === "topLevel"
            ? this.topLevelToIndex(prop)
            : prop
        ],

        invoke: ([name]: Token[]) => {
          return [serializeProjection(this.getters[name])]
        },

        trace: (args: Token[]) => {
          const inner = args.length === 2 ? expression[1] : expression[0];
          const nextToken = inner instanceof Expression ? inner[0] : inner;
          const innerSrc = this.shortSource(
            nextToken[SourceTag] || currentToken[SourceTag]
          );
          return [args[0], nextToken.$type, innerSrc];
        },
        and: prependID,
        or: prependID,
        ternary: prependID,
        range: ([end, start, step]: Token[]) => [
          end,
          _.defaultTo(start, 0),
          _.defaultTo(step, 1)
        ]
      };

      const args = _.map(
        (argsManipulators[type] || _.identity)(expressionArgs),
        serializeProjection
      );
      return {
        type,
        args,
        invalidates: currentToken.$invalidates,
        metaData,
        source: this.options.debug
          ? this.shortSource(currentToken[SourceTag])
          : null
      };
    };

    const sources = new WeakMap<GetterProjection, string>()

    const serializeProjection = (expression: any): Reference => {
      if (expression instanceof SetterExpression) {
        return 0
      }

      if (_.isNumber(expression)) {
       return expression
      }
      if (
        !expression ||
        _.isPlainObject(expression) ||
        !_.isObject(expression)
      ) {
        return packPrimitiveIndex(primitiveMap.add(expression))
      }

      const currentToken: Token = expression instanceof Token ? expression : expression[0];
      
      if (currentToken.$type === 'invoke') {
        return serializeProjection(this.getters[expression[1]][1])
      }

      const proj = generateProjectionFromExpression(expression)
      const packed = [packProjectionHeader(proj.type || '', proj.metaData, !!proj.invalidates), ...proj.args] as GetterProjection
      sources.set(packed, this.shortSource(currentToken[SourceTag]))
      return packProjectionIndex(projectionsMap.add(packed))
    };

    const topLevels: TopLevel[] = astGetters.map(name => {
      const proj = serializeProjection(this.getters[name])
      if (!this.options.debug && name[0] === '$') {
        return proj
      }

      return [proj, primitiveMap.add(name)] as [Reference, number]
    })

    const serializeSetter = (
      setter: SetterExpression,
      name: string
    ): SetterProjection => {
      const setterType = setter.setterType();
      const numTokens =
        setter.filter((part: Token | string | number) => part instanceof Token)
          .length - 1;
      const setterProjection = [...setter.slice(1)].map(token => {
        if (token instanceof Token && token.$type === "key") {
          return serializeProjection(new Token(`arg${numTokens - 1}`, ""));
        }

        return serializeProjection(token);
      });
      return [
        primitiveMap.add(setterType),
        primitiveMap.add(name),
        numTokens,
        ...setterProjection
      ];
    };

    const setters = _.map(this.setters, serializeSetter);

    const pathByHash: {[hash: string]: Reference[]} = {}

    const getters = projectionsMap.values()

    const projectionData = {
      getters,
      primitives: primitiveMap.values(),
      topLevels,
      metaData: metaDataMap.values(),
      paths: pathMap.values(),
      setters,
      sources: this.options.debug ? getters.map(g => sources.get(g) || '') : []
    };

    require('fs').writeFileSync('pd.json', JSON.stringify(projectionData), 'utf8')
    return projectionData
  }

  compile() {
    return `(${this.buildEnvelope()})(${JSON.stringify(
      this.buildProjectionData()
    )}, {debugMode: ${!!this.options.debug}})`;
  }

  allExpressions() {
    return this.mergeTemplate(this.template.updateDerived, {
      RT: this.buildRT()
    });
  }
}

module.exports = VMCompiler;
