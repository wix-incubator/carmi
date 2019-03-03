const OptimizingCompiler = require('../optimizing-compiler')
import * as rt from './vm-rt'
import * as _ from 'lodash'
import {exprHash} from '../expr-hash'

import { ProjectionData, GetterProjection, PrimitiveIndex, ProjectionMetaData, ProjectionType } from './types'
import { Token, Expression } from '../lang';

const {packPrimitiveIndex} = rt
type IntermediateReferenceKey = '$$ref' | '$$primitive'

interface IntermediateReference {
   ref: string
   table: 'primitives' | 'projections'
}

type MetaDataHash = string
type PrimitiveHash = string
type ProjectionHash = string
interface IntermediateProjection {
    type: PrimitiveHash
    metaData: MetaDataHash
    args: IntermediateReference[]
}

class VMCompiler extends OptimizingCompiler {
    buildRT() {
       return _.map(rt, func => func.toString()).join('\n')
    }

    get template() {
        return require('../templates/vm-template.js');
      }
    
    buildEnvelope() {
        return `
            function buildEnvelope($projectionData) {
                return ${super.compile()}
            }`
    }

    buildProjectionData() : ProjectionData {
        debugger
        const projectionsByHash: {[hash: string]: IntermediateProjection}  = {}
        const primitivesByHash : {[hash: string]: any} = {}
        const astGetters = this.getRealGetters() as string[]
        const addPrimitive = (p: any) : string => {
            const hash = exprHash(p)
            if (!_.has(primitivesByHash, hash)) {
                primitivesByHash[hash] = p
            }

            return hash
        }

        const generateProjectionFromExpression = (expression : Expression | Token) : IntermediateProjection => {
            const currentToken : Token = expression instanceof Token ? expression : expression[0]
            const args = expression instanceof Expression ? expression.slice(1) : []
            const type : ProjectionType = currentToken.$type
            switch (type) {
                default:
                    return {type: addPrimitive(type), metaData: '', args: _.map(args, serializeProjection)}
            }
        }

        const serializeProjection = (expression: any) : IntermediateReference => {
            if (!expression || _.isPlainObject(expression) || !_.isObject(expression)) {
                return {ref: addPrimitive(expression), table: 'primitives'}
            }

            // Short-circuit func optimization, it's a code-size optimization
            if (expression instanceof Expression && expression[0].$type === 'func') {
                return serializeProjection(expression[1])
            }

            const hash = exprHash(expression)
            if (!_.has(projectionsByHash, hash)) {
                projectionsByHash[hash] = generateProjectionFromExpression(expression)
            }

            return {ref: hash, table: 'projections'}
        }

        const packRef = (r: IntermediateReference) => 
            r.table === 'primitives' ? packPrimitiveIndex(primitiveHashes.indexOf(r.ref)) : rt.packProjectionIndex(projectionHashes.indexOf(r.ref))

        const packProjection = (p : IntermediateProjection) : GetterProjection => 
            [primitiveHashes.indexOf(p.type), p.args.map(packRef), 0]

        const intermediateTopLevels: Array<{name: string, hash: ProjectionHash}> = 
            astGetters.map(name => ({name, hash: serializeProjection(this.getters[name]).ref}))


        const projectionHashes = Object.keys(projectionsByHash)
        const primitiveHashes = Object.keys(primitivesByHash)

        const getters = projectionHashes.map(hash => packProjection(projectionsByHash[hash]))
        const primitives = primitiveHashes.map(hash => primitivesByHash[hash])

        const topLevels = intermediateTopLevels.map(({name, hash} : {name: string, hash: ProjectionHash}) => ({name, projectionIndex: projectionHashes.indexOf(hash)}))

        return {
            getters,
            primitives,
            topLevels,
            metaData: []
        }
    }

    compile() {
        return `(${this.buildEnvelope()})(${JSON.stringify(this.buildProjectionData())})`
    }

    allExpressions() {
        return this.mergeTemplate(this.template.updateDerived, {
            RT: this.buildRT()
        })
      }    
}


module.exports = VMCompiler