import {TokenTypeData} from '../lang'

export type Reference = number
export type TypeIndex = number
export type PrimitiveIndex = number
export type MetaDataIndex = number
export type GetterProjection = [TypeIndex, Reference[], MetaDataIndex]
export type ProjectionType = keyof typeof TokenTypeData
export type GetterArgs = Reference[]
export type InvalidatedRoots = Set<number>
export interface TopLevel {
    name: string
    projectionIndex: number
}

export interface ProjectionMetaData {
    source: string
    flags: number
    invalidatingPath: any
    trackedExpr: any
}

export interface ProjectionData {
    getters: GetterProjection[]
    metaData: ProjectionMetaData[]
    topLevels: TopLevel[]
    primitives: any[]   
}

export type Tracked = any[]


interface FunctionLibrary {
    [functionName: string]: (...args: any[]) => any
}

type ArrayFunc =  ($tracked: Tracked, identifier: number | string, func : (tracked: any, key: any, val: any, context: any, loop: any) => any, src: any[], context: any, $invalidates: boolean) => any[]
interface OptimizerLibrary {
    map: ArrayFunc
    call: (tracked: Tracked, newVal: any, identifier: number, len: number, invalidates: boolean) => any
    setOnArray: <T>(target: T[], key: number, val: T, invalidates: boolean) => void
}

export interface VMParams {
    $projectionData: ProjectionData
    $funcLib: FunctionLibrary
    $funcLibRaw: FunctionLibrary
    library: OptimizerLibrary
}

export interface StepParams {
    $first: boolean
    $invalidatedRoots: InvalidatedRoots
    $tainted: any
    $res: any
    $model: any
}
