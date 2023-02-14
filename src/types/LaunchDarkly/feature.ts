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
            targets?: Target[]
            rules?: Rule[]
            fallthrough?: Fallthrough
            prerequisites?: Prerequisite[]
        }
    }
}

export type Fallthrough = {
    variation?: number
    rollout?: {
        variations: WeightedVariation[]
    }
}

type WeightedVariation = {
    variation: number
    weight: number
}

type Prerequisite = {
    key: string
    variation: number
}

export enum FeatureKind {
    boolean = 'boolean',
    multivariate = 'multivariate',
}
