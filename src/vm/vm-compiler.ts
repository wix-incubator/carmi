const OptimizingCompiler = require('../optimizing-compiler')
import * as rt from './vm-rt'
import * as _ from 'lodash'
import { exprHash } from '../expr-hash'

import { ProjectionData, GetterProjection, PrimitiveIndex, ProjectionMetaData, ProjectionType, SetterProjection } from './types'
import { Token, Expression, SourceTag, SetterExpression } from '../lang';

const { packPrimitiveIndex } = rt
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
    topLevelOverrides() {
        return Object.assign({}, super.topLevelOverrides(), {
            SETTERS: ''
        });
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



    buildProjectionData(): ProjectionData {
        debugger
        const projectionsByHash: { [hash: string]: Partial<IntermediateProjection> } = {}
        const primitivesByHash: { [hash: string]: any } = {}
        const metaDataByHash: { [hash: string]: Partial<ProjectionMetaData> } = {}
        const astGetters = this.getRealGetters() as string[]
        const addPrimitive = (p: any): string => {
            const hash = exprHash(p)
            if (!_.has(primitivesByHash, hash)) {
                primitivesByHash[hash] = p
            }

            return hash
        }

        const addMetaData = (m: Partial<ProjectionMetaData> = {}): string => {
            const mdHash = exprHash(m)
            if (!_.has(metaDataByHash, mdHash)) {
                metaDataByHash[mdHash] = m
            }

            return mdHash
        }

        const generateProjectionFromExpression = (expression: Expression | Token): Partial<IntermediateProjection> => {
            const currentToken: Token = expression instanceof Token ? expression : expression[0]
            const args = expression instanceof Expression ? expression.slice(1) : []
            const $type: ProjectionType = currentToken.$type
            const source = currentToken[SourceTag]
            const type = addPrimitive($type)
            const metaData = addMetaData({
                ...source ? { source: this.shortSource(source) } : {},
                ...currentToken.$tracked ? { tracked: true } : {},
                ...currentToken.$invalidates ? { invalidates: true } : {},
                invalidatingPath: [],
                trackedExpr: null
            })
            switch ($type) {
                case 'get': {
                    const isTopLevel = expression[2] instanceof Token && expression[2].$type === 'topLevel'
                    return {
                        type,
                        args: [
                            serializeProjection(expression[2]),
                            serializeProjection(isTopLevel ? this.topLevelToIndex(expression[1]) : expression[1])
                        ]
                    }
                }
                case 'range':
                    return { type, args: _.map([args[0], _.defaultTo(args[1], 0), _.defaultTo(args[2], 1)], serializeProjection), metaData }
                default:
                    return { type, args: _.map(args, serializeProjection), metaData }
            }
        }

        const serializeProjection = (expression: any): IntermediateReference => {
            if (!expression || _.isPlainObject(expression) || !_.isObject(expression)) {
                return { ref: addPrimitive(expression), table: 'primitives' }
            }

            // Short-circuit func optimization, it's a code-size optimization
            if (expression instanceof Expression && expression[0].$type === 'func') {
                return serializeProjection(expression[1])
            }

            const hash = exprHash(expression)
            if (!_.has(projectionsByHash, hash)) {
                projectionsByHash[hash] = generateProjectionFromExpression(expression)
            }

            return { ref: hash, table: 'projections' }
        }

        const packRef = (r: IntermediateReference) =>
            r.table === 'primitives' ? packPrimitiveIndex(primitiveHashes.indexOf(r.ref)) : rt.packProjectionIndex(projectionHashes.indexOf(r.ref))

        const packProjection = (p: Partial<IntermediateProjection>): GetterProjection =>
            [primitiveHashes.indexOf(p.type || ''), (p.args || []).map(packRef), 0]

        const intermediateTopLevels: Array<{ name: string, hash: ProjectionHash }> =
            astGetters.map(name => ({ name, hash: serializeProjection(this.getters[name]).ref }))

        type IntermediateSetter = [string, string, IntermediateReference[], number]

        const serializeSetter = (setter: SetterExpression, name: string) : IntermediateSetter => {
            const setterType = setter.setterType()
            const numTokens = setter.filter((part: Token | string | number) => part instanceof Token).length - 1
            const setterProjection = [...setter.slice(1)].map(token => {
                if (setterType === 'splice' && token instanceof Token && token.$type === 'key') {
                    return serializeProjection(new Token(`arg${numTokens - 1}`, ''))
                }

                return serializeProjection(token)    
            })
            return [addPrimitive(setterType), addPrimitive(name), setterProjection, numTokens]
        }

        const intermediateSetters = _.map(this.setters, serializeSetter)

        const projectionHashes = Object.keys(projectionsByHash)
        const primitiveHashes = Object.keys(primitivesByHash)
        const mdHashes = Object.keys(metaDataByHash)

        const getters = projectionHashes.map(hash => packProjection(projectionsByHash[hash]))
        const primitives = primitiveHashes.map(hash => primitivesByHash[hash])

        const metaData = mdHashes.map(hash => metaDataByHash[hash])
        const setters = intermediateSetters.map(([typeHash, nameHash, projection, numTokens] : IntermediateSetter)=> 
            [primitiveHashes.indexOf(typeHash), primitiveHashes.indexOf(nameHash), projection.map(packRef), numTokens]) as SetterProjection[]

        const topLevels = intermediateTopLevels.map(({ name, hash }: { name: string, hash: ProjectionHash }) =>
            [projectionHashes.indexOf(hash), name] as [number, string])
        
            
        return {
            getters,
            primitives,
            topLevels,
            metaData,
            setters
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