export type Feature = {
    _id?: string
    _project?: string
    name?: string
    description?: string
    key: string
    type?: 'release' | 'experiment' | 'permission' | 'ops'
    variations?: Variation[]
    variables?: Variable[]
    tags?: string[]
}

export type Variable = {
    name?: string
    description?: string
    key: string
    _feature?: string
    type: 'String' | 'Number' | 'Boolean' | 'JSON'
    defaultValue?: object
}

export type Variation = {
    key: string
    name: string
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
