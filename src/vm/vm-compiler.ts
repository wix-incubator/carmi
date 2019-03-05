const OptimizingCompiler = require("../optimizing-compiler");
import * as rt from "./vm-rt";
import * as _ from "lodash";
import {
  exprHash
} from "../expr-hash";
import {
  pathMatches
} from '../expr-tagging'

import {
  ProjectionData,
  GetterProjection,
  ProjectionMetaData,
  ProjectionType,
  SetterProjection,
  Source
} from "./vm-types";
import {
  Token,
  Expression,
  SourceTag,
  SetterExpression
} from "../lang";

const {
  packPrimitiveIndex
} = rt;
type IntermediateReferenceKey = "$$ref" | "$$primitive";

interface IntermediateReference {
  ref: string;
  table: "primitives" | "projections" | "id";
}


interface IntermediateMetaData {
  source: string
  paths: Array < [IntermediateReference, IntermediateReference[]] >
    trackedExpr: number[]
  tracked: boolean
  invalidates: boolean
}

type MetaDataHash = string;
type PrimitiveHash = string;
type ProjectionHash = string;
interface IntermediateProjection {
  id: number
  type: PrimitiveHash;
  metaData: MetaDataHash;
  source: number
  args: IntermediateReference[];
}

interface IntermediateSource {
  file: string
  line: number
  col: number
}

class VMCompiler extends OptimizingCompiler {
  buildRT() {
    return _.map(rt, func => func.toString()).join("\n");
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
    debugger;
    const projectionsByHash: {
      [hash: string]: Partial < IntermediateProjection > ;
    } = {};
    const primitivesByHash: {
      [hash: string]: any
    } = {};
    const metaDataByHash: {
      [hash: string]: Partial < IntermediateMetaData >
    } = {};
    const intermediateSources: (IntermediateSource | null)[] = [null]
    const astGetters = this.getRealGetters() as string[];
    const addPrimitive = (p: any): string => {
      const hash = exprHash(p);
      if (!_.has(primitivesByHash, hash)) {
        primitivesByHash[hash] = p;
      }

      return hash;
    };

    const addSource = (s?: string): number => {
      if (!s || !this.options.debug) {
        return 0
      }

      const parseSource = /([^\s]+)\:(\d+)\:(\d+)$/.exec(this.shortSource(s))
      if (!parseSource) {
        return 0
      }
      intermediateSources.push({file: addPrimitive(parseSource[1]), line: +parseSource[2], col: +parseSource[3]})
      return intermediateSources.length - 1
    }

    const addMetaData = (m: Partial < IntermediateMetaData > = {}): string => {
      const mdHash = exprHash(m);
      if (!_.has(metaDataByHash, mdHash)) {
        metaDataByHash[mdHash] = m;
      }

      return mdHash;
    };

    const generateProjectionFromExpression = (
      expression: Expression | Token
    ): Partial < IntermediateProjection > => {
      const currentToken: Token =
        expression instanceof Token ? expression : expression[0];
      const expressionArgs = expression instanceof Expression ? expression.slice(1) : [];
      const $type: ProjectionType = currentToken.$type;
      const pathsThatInvalidate = currentToken.$path || new Map;
      const paths: Array < [IntermediateReference, IntermediateReference[]] > = [];
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

      const type = addPrimitive($type);
      const source = addSource(currentToken[SourceTag])
      const metaData = addMetaData({
        ...(currentToken.$tracked ? {
          tracked: true
        } : {}),
        ...(currentToken.$invalidates ? {
          invalidates: true
        } : {}),
        ...(paths ? {
          paths
        } : {}),
        ...(currentToken.$trackedExpr ? {
          trackedExpr: Array.from(currentToken.$trackedExpr.values())
        } : {})
      });

      const argsManipulators : {[key: string]: (args: Token[]) => any[]} = {
        get: ([prop, obj]: Token[]) => 
          [obj, obj instanceof Token && obj.$type === "topLevel" ? this.topLevelToIndex(prop) : prop],

        trace: (args: Token[]) => {
          const inner = args.length === 2 ? expression[1] : expression[0]
          const nextToken = inner instanceof Expression ? inner[0] : inner
          const innerSrc = nextToken[SourceTag] || currentToken[SourceTag]
          return [
            args[0],
            nextToken.$type,
            innerSrc
          ]
        },
        range: ([end, start, step]: Token[]) => [end, _.defaultTo(start, 0), _.defaultTo(step, 1)]
      }

      const args = _.map((argsManipulators[$type] || _.identity)(expressionArgs), serializeProjection)
        return {
          id: currentToken.$id,
          type,
          args,
          metaData,
          source
        };
    };

    const serializeProjection = (expression: any): IntermediateReference => {
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
      r.table === "primitives" ?
      packPrimitiveIndex(primitiveHashes.indexOf(r.ref)) :
      rt.packProjectionIndex(projectionHashes.indexOf(r.ref));

    const packProjection = (
      p: Partial < IntermediateProjection >
    ): GetterProjection => [
      p.id || 0,
      primitiveHashes.indexOf(p.type || ""),
      (p.args || []).map(packRef),
      p.metaData ? mdHashes.indexOf(p.metaData) : 0,
      p.source || 0
    ];

    const intermediateTopLevels: Array < {
      name: string;
      hash: ProjectionHash;
    } > = astGetters.map(name => ({
      name,
      hash: serializeProjection(this.getters[name]).ref
    }));

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
    const primitiveHashes = Object.keys(primitivesByHash);
    const mdHashes = ['', ...Object.keys(metaDataByHash)]

    const getters = projectionHashes.map(hash =>
      packProjection(projectionsByHash[hash])
    );
    const primitives = primitiveHashes.map(hash => primitivesByHash[hash]);

    const packMetaData = (md: Partial < IntermediateMetaData > ): ProjectionMetaData =>
      ([
        (md.tracked ? 1 : 0) | (md.invalidates ? 2 : 0),
        (md.paths || []).map(([cond, path]: [IntermediateReference, IntermediateReference[]]) => [
          packRef(cond), path.map(packRef)
        ]) as Array < [number, number[]] > ,
        md.trackedExpr || []
      ])

    const metaData = mdHashes.map((hash, index) => index ? packMetaData(metaDataByHash[hash]) : [0, [], []] as ProjectionMetaData);
    const setters = intermediateSetters.map(
      ([typeHash, nameHash, projection, numTokens]: IntermediateSetter) => [
        primitiveHashes.indexOf(typeHash),
        primitiveHashes.indexOf(nameHash),
        projection.map(packRef),
        numTokens
      ]
    ) as SetterProjection[];

    const topLevels = intermediateTopLevels.map(
      ({
        name,
        hash
      }: {
        name: string;hash: ProjectionHash
      }) => [projectionHashes.indexOf(hash), name] as[number, string]
    );

    const sources: (Source | null)[] = intermediateSources.map(source => source ? [source.line, source.col, primitiveHashes.indexOf(source.file)] as Source : null)

    return {
      getters,
      primitives,
      topLevels,
      metaData,
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