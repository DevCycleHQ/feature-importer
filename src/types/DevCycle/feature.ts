export type Feature = {
    _id?: string
    _project?: string
    name?: string
    description?: string
    key: string
    type?: FeatureType
    variations?: Variation[]
    variables?: Variable[]
    tags?: string[]
    sdkVisibility?: SDKVisibility
}

export type Variable = {
    name?: string
    description?: string
    key: string
    _feature?: string
    type: VariableType
    defaultValue?: object
}

export type Variation = {
    key: string
    name?: string
    variables?: {
        [key: string]: string | number | boolean | object
    }
}

export enum VariableType {
    string = 'String',
    number = 'Number',
    boolean = 'Boolean',
    json = 'JSON',
}

export enum FeatureType {
    release = 'release',
    experiment = 'experiment',
    permission = 'permission',
    ops = 'ops',
}

type SDKVisibility = {
    mobile: boolean
    client: boolean
    server: boolean
}