const OptimizingCompiler = require("../optimizing-compiler");
import * as rt from "./vm-rt";
import * as _ from "lodash";
import { exprHash } from "../expr-hash";
import { pathMatches } from "../expr-tagging";

import {
  ProjectionData,
  GetterProjection,
  ProjectionMetaData,
  ProjectionType,
  Reference,
  SetterProjection
} from "./vm-types";
import { Token, Expression, SourceTag, SetterExpression } from "../lang";

const { packPrimitiveIndex, packProjectionHeader } = rt;

interface IntermediateReference {
  ref: string | number
  table: "primitives" | "projections" | "numbers"
}

interface IntermediateMetaData {
  source: string;
  paths: Array<[IntermediateReference, IntermediateReference[]]>;
  invalidates: boolean;
}

type MetaDataHash = string;
type PrimitiveHash = string;
type ProjectionHash = string;
interface IntermediateProjection {
  id: number;
  type: string;
  invalidates: boolean
  metaData: MetaDataHash;
  source: string | null;
  args: IntermediateReference[];
}

interface IntermediateSource {
  file: string;
  line: number;
  col: number;
}

class VMCompiler extends OptimizingCompiler {
  buildRT() {
    return _.map(rt, (val: any, name: string) => 
        _.isFunction(val) ? val.toString() : `exports.${name} = ${JSON.stringify(val)}`)
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
    const projectionsByHash: {
      [hash: string]: Partial<IntermediateProjection>;
    } = {};
    const primitivesByHash: {
      [hash: string]: any;
    } = {};
    const metaDataByHash: {
      [hash: string]: Partial<IntermediateMetaData>;
    } = {};
    const astGetters = this.getRealGetters() as string[];
    const addPrimitive = (p: any): string => {
      const hash = exprHash(_.defaultTo(p, null));
      if (!_.has(primitivesByHash, hash)) {
        primitivesByHash[hash] = p;
      }

      return hash;
    };

    const addMetaData = (m: Partial<IntermediateMetaData> = {}): string => {
      const mdHash = exprHash(m);
      if (!_.has(metaDataByHash, mdHash)) {
        metaDataByHash[mdHash] = m;
      }

      return mdHash;
    };

    const generateProjectionFromExpression = (
      expression: Expression | Token
    ): Partial<IntermediateProjection> => {
      const currentToken: Token =
        expression instanceof Token ? expression : expression[0];
      
      const expressionArgs =
        expression instanceof Expression ? expression.slice(1) : [];
      const type: string = currentToken.$type;

      const pathsThatInvalidate = currentToken.$path || new Map();
      const paths: Array<[IntermediateReference, IntermediateReference[]]> = [];
      pathsThatInvalidate.forEach(
        (cond: Expression, invalidatedPath: Expression[]) => {
          const condProj = serializeProjection(cond);
          if (invalidatedPath[0].$type === "context") {
            paths.push([
              condProj,
              [invalidatedPath[0], 0, ...invalidatedPath.slice(1)].map(
                serializeProjection
              )
            ]);
          } else if (
            invalidatedPath.length > 1 &&
            invalidatedPath[0].$type === "topLevel"
          ) {
            paths.push([
              condProj,
              [
                invalidatedPath[0],
                this.topLevelToIndex(invalidatedPath[1]),
                ...invalidatedPath.slice(2)
              ].map(serializeProjection)
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
            paths.push([condProj, invalidatedPath.map(serializeProjection)]);
          }
        }
      );

      const metaData = paths && paths.length ? addMetaData({paths}) : null

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
        ...(metaData ? {metaData} : {}),
        source: this.options.debug
          ? this.shortSource(currentToken[SourceTag])
          : null
      };
    };

    const serializeProjection = (expression: any): IntermediateReference => {
      if (_.isNumber(expression)) {
        return {ref: expression, table: 'numbers'}
      }
      if (
        !expression ||
        _.isPlainObject(expression) ||
        !_.isObject(expression)
      ) {
        return {
          ref: addPrimitive(expression),
          table: "primitives"
        };
      }

      const currentToken: Token = expression instanceof Token ? expression : expression[0];
      
      if (currentToken.$type === 'invoke') {
        return serializeProjection(this.getters[expression[1]][1])
      }

      const hash = exprHash(expression);
      if (!_.has(projectionsByHash, hash)) {
        projectionsByHash[hash] = generateProjectionFromExpression(expression);
      }

      return {
        ref: hash,
        table: "projections"
      };
    };

    const packRef = (r: IntermediateReference) =>
        r.table === 'numbers' ? +r.ref :
        r.table === "primitives" ? packPrimitiveIndex(primitiveHashes.indexOf(r.ref as string))
        : rt.packProjectionIndex(projectionHashes.indexOf(r.ref as string));

    const packProjection = (
      p: Partial<IntermediateProjection>
    ): GetterProjection => [
      packProjectionHeader(p.type || '', p.metaData ? mdHashes.indexOf(p.metaData): 0, !!p.invalidates),
      ...(p.args || []).map(packRef)
    ];

    const intermediateTopLevels: Array<{
      name: string | null
      hash: ProjectionHash;
    }> = astGetters.map(name => {
      const proj = serializeProjection(this.getters[name])
      return {name: (this.options.debug || name[0] !== '$') ? addPrimitive(name) : null, hash: proj.ref as string}
    })

    type IntermediateSetter = [string, string, IntermediateReference[], number];

    const serializeSetter = (
      setter: SetterExpression,
      name: string
    ): IntermediateSetter => {
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
        addPrimitive(setterType),
        addPrimitive(name),
        setterProjection,
        numTokens
      ];
    };

    const intermediateSetters = _.map(this.setters, serializeSetter);

    const projectionHashes = Object.keys(projectionsByHash);
    const sources: (string | null)[] = this.options.debug
      ? projectionHashes.map(hash => projectionsByHash[hash].source || null)
      : [];
    const primitiveHashes = Object.keys(primitivesByHash);
    const mdHashes = ["", ...Object.keys(metaDataByHash)];

    const getters = projectionHashes.map(hash =>
      packProjection(projectionsByHash[hash])
    );
    const primitives = primitiveHashes.map(hash => primitivesByHash[hash]);
    const pathByHash: {[hash: string]: Reference[]} = {}

    const addPath = (path: Reference[]) : string => {
      const hash = exprHash(path)
      if (!_.has(pathByHash, hash)) {
        pathByHash[hash] = path
      }
      return hash
    }

    const packMetaData = (
      md: Partial<IntermediateMetaData>
    ): string[] => (md.paths || []).map(([cond, path]: [IntermediateReference, IntermediateReference[]]) => addPath([
          packRef(cond),
          ...path.map(packRef)
        ]))

    const metaData2 = mdHashes.map((hash, index) =>
      index
        ? packMetaData(metaDataByHash[hash])
        : ([] as string[])
    );

    const pathHashes = Object.keys(pathByHash)

    const metaData = metaData2.map((paths: string[]) => paths.map(hash => pathHashes.indexOf(hash))) as ProjectionMetaData[]

    const setters = intermediateSetters.map(
      ([typeHash, nameHash, projection, numTokens]: IntermediateSetter) => [
        primitiveHashes.indexOf(typeHash),
        primitiveHashes.indexOf(nameHash),
        numTokens,
        ...projection.map(packRef)
      ]
    ) as SetterProjection[];

    const topLevels = intermediateTopLevels.map(
      ({ name, hash }: { name: string | null; hash: ProjectionHash }) => name ? [
        projectionHashes.indexOf(hash),
        primitiveHashes.indexOf(name)] as [number, number] : projectionHashes.indexOf(hash))
  
    return {
      getters,
      primitives,
      topLevels,
      metaData,
      paths: pathHashes.map(hash => pathByHash[hash]),
      setters,
      sources
    };
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
