import {TokenTypeData, Setter} from '../lang'

export type Reference = number
export type TypeIndex = number
export type NameIndex = number
export type PrimitiveIndex = number
export type MetaDataIndex = number
export type SourceIndex = number
export type GetterProjection = [number, TypeIndex, MetaDataIndex, ...Reference[]]
export type ProjectionType = keyof typeof TokenTypeData
export type InvalidatedRoots = Set<number>
export type TopLevel = number | [number, string]

export type SetterProjection = [TypeIndex, NameIndex, Reference[], number] 
export type InvalidationPath = [Reference, Reference[]]
export type ProjectionMetaData = [number, InvalidationPath[], number[]]

export interface ProjectionData {
    getters: GetterProjection[]
    setters: SetterProjection[]
    metaData: ProjectionMetaData[]
    sources: (string | null)[]
    topLevels: (TopLevel | number)[]
    primitives: any[]   
}

export type Tracked = any[]

interface FunctionLibrary {
    [functionName: string]: (...args: any[]) => any
}

type SetterFunc = (...args: any[]) => any

type ArrayFunc =  ($tracked: Tracked, identifier: number | string, func : (tracked: any, key: any, val: any, context: any, loop: any) => any, src: any[], context: any, $invalidates: boolean) => any[]
export type OptimizerFuncNonPredicate = ($tracked: Tracked, src: object, identifier: number | string) => any
type GeneralOptimizerFunc = (tracked: Tracked, newVal: any, identifier: number|string, len: number, invalidates: boolean) => any
interface OptimizerLibrary {
    map: ArrayFunc
    size: OptimizerFuncNonPredicate
    flatten: OptimizerFuncNonPredicate
    sum: OptimizerFuncNonPredicate
    array: GeneralOptimizerFunc
    assignOrDefaults: (tracked: Tracked, identifier: string | number, src: any[], assign: boolean, invalidates: boolean) => any
    object: (tracked: Tracked, values: any[], identifier: number | string, keysList: string[], invalidates: boolean) => any
    bind: GeneralOptimizerFunc
    call: GeneralOptimizerFunc
    set: SetterFunc
    splice: SetterFunc
    push: SetterFunc
    mathFunction: (name: string, source: string) => (arg: number) => number
    range: (tracked: Tracked, end: number, start: number, step: number, identifier: string | number, invalidates: boolean) => number[]
    valuesOrKeysForObject: (tracked: Tracked, identifier: string | number, src: any[], values: boolean, invalidates: boolean) => any[]
    $setter: (func: SetterFunc) => any
    setOnArray: <T>(target: T[], key: number, val: T, invalidates: boolean) => void
    trackPath: (tracked: Tracked, path: any[]) => void
    checkTypes: (input: any, name: string, types: ('array' | 'object')[], functionName: string, source: string) => void

}

export interface VMParams {
    $projectionData: ProjectionData
    $res: any
    $funcLib: any
    library: OptimizerLibrary
    debugMode: boolean
}

export interface StepParams {
    $first: boolean
    $invalidatedRoots: InvalidatedRoots
    $model: any
}

