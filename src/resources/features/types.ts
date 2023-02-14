import { Feature, FeatureConfiguration } from '../../types/DevCycle'

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

export type FeatureSummary = {
    createdCount: number
    updatedCount: number
    skippedCount: number
    errored: Record<string, string>
}
