import { Feature, FeatureConfiguration } from './DevCycle'

export type FeaturesToImport = {
    [key: string]: {
        feature: Feature,
        action: FeatureImportAction
        configs?: {
            environment: string,
            targetingRules: FeatureConfiguration,
        }[]
    }
}

export enum FeatureImportAction {
    Create = 'create',
    Update = 'update',
    Skip = 'skip',
    Unsupported = 'unsupported',
}
