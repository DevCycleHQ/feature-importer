import { Feature, FeatureConfiguration } from './DevCycle'

export type FeaturesToImport = {
    [key: string]: {
        feature: Feature,
        action: 'create' | 'update' | 'skip' | 'unsupported'
        configs?: {
            environment: string,
            targetingRules: FeatureConfiguration,
        }[]
    }
}