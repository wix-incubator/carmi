import {TokenTypeData, Setter} from '../lang'

export type Reference = number
export type TypeIndex = number
export type NameIndex = number
export type PrimitiveIndex = number
export type MetaDataIndex = number
export type GetterProjection = [TypeIndex, Reference[], MetaDataIndex]
export type ProjectionType = keyof typeof TokenTypeData
export type GetterArgs = Reference[]
export type InvalidatedRoots = Set<number>
export type TopLevel = [number, string]

export type SetterProjection = [TypeIndex, NameIndex, Reference[], number] 

export interface ProjectionMetaData {
    source: string
    tracked: boolean
    invalidates: boolean
    invalidatingPath: any
    trackedExpr: any
}

export interface ProjectionData {
    getters: GetterProjection[]
    setters: SetterProjection[]
    metaData: Partial<ProjectionMetaData>[]
    topLevels: TopLevel[]
    primitives: any[]   
}

export type Tracked = any[]

interface FunctionLibrary {
    [functionName: string]: (...args: any[]) => any
}

type SetterFunc = (...args: any[]) => any

type ArrayFunc =  ($tracked: Tracked, identifier: number | string, func : (tracked: any, key: any, val: any, context: any, loop: any) => any, src: any[], context: any, $invalidates: boolean) => any[]
export type OptimizerFuncNonPredicate = ($tracked: Tracked, src: object, identifier: number | string) => any
type GeneralOptimizerFunc = (tracked: Tracked, newVal: any, identifier: number, len: number, invalidates: boolean) => any
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
    valuesOrKeysForObject: (tracked: Tracked, identifier: string | number, src: any[], values: boolean, invalidates: boolean) => any
    $setter: (func: SetterFunc) => any
    setOnArray: <T>(target: T[], key: number, val: T, invalidates: boolean) => void
}

export interface VMParams {
    $projectionData: ProjectionData
    $funcLib: FunctionLibrary
    $funcLibRaw: FunctionLibrary
    $res: any
    library: OptimizerLibrary
}

export interface StepParams {
    $first: boolean
    $invalidatedRoots: InvalidatedRoots
    $tainted: any
    $model: any
}

