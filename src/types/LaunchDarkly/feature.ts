import { Target, Rule } from './targeting'

export type Feature = {
    name: string
    kind: FeatureKind
    description?: string
    key: string
    _version: number
    creationDate: number
    includeInSnippet?: boolean
    clientSideAvailability?: {
        usingEnvironmentIds: boolean
        usingMobileKey: boolean
    }
    variations: {
        name?: string
        _id: string
        value: any
    }[]
    temporary?: boolean
    tags?: string[]
    _links?: {
        self: {
            href: string
            type: string
        }
    }
    maintainerId: string
    environments: {
        [key: string]: {
            on: boolean,
            targets: Target[],
            rules: Rule[]
        }
    }
}

export enum FeatureKind {
    boolean = 'boolean',
    multivariate = 'multivariate',
}
