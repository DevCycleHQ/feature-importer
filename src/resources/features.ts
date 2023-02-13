import { LD, DVC } from '../api'
import { Feature } from '../types/DevCycle'
import { mapLDFeatureToDVCFeature } from '../utils/LaunchDarkly'
import { ParsedImporterConfig } from '../configs'
import { FeatureImportAction, FeaturesToImport } from '../types'

export const prepareFeaturesToImport = async (config: ParsedImporterConfig) => {
    const { includeFeatures, excludeFeatures, overwriteDuplicates, projectKey } = config

    const existingFeatures = await DVC.getFeaturesForProject(projectKey)
    const { items: ldFeatures } = await LD.getFeatureFlagsForProject(projectKey)

    const featuresToImport: FeaturesToImport = {}

    const existingFeaturesMap = existingFeatures.reduce((map: { [key: string]: Feature }, feature: Feature) => {
        map[feature.key] = feature
        return map
    }, {})

    for (const feature of ldFeatures) {
        const mappedFeature = mapLDFeatureToDVCFeature(feature)
        const isDuplicate = existingFeaturesMap[mappedFeature.key] !== undefined
        const includeFeature = (includeFeatures && includeFeatures.size > 0) ?
            includeFeatures.get(mappedFeature.key) :
            true
        const excludeFeature = (excludeFeatures && excludeFeatures.size > 0) ?
            excludeFeatures.get(mappedFeature.key) :
            false

        if (!includeFeature || excludeFeature) {
            featuresToImport[mappedFeature.key] = { feature: mappedFeature, action: FeatureImportAction.Skip }
            continue
        }
        if (!isDuplicate) {
            featuresToImport[mappedFeature.key] = { feature: mappedFeature, action: FeatureImportAction.Create }
        } else if (overwriteDuplicates) {
            featuresToImport[mappedFeature.key] = { feature: mappedFeature, action: FeatureImportAction.Update }
        } else {
            featuresToImport[mappedFeature.key] = { feature: mappedFeature, action: FeatureImportAction.Skip }
        }
    }
    return { featuresToImport, ldFeatures }

}

export const importFeatures = async (
    config: ParsedImporterConfig,
    featuresToImport: FeaturesToImport,
) => {
    const { projectKey } = config
    let createdCount = 0
    let updatedCount = 0
    let skippedCount = 0
    const featureErrors: Record<string, string> = {}
    for (const featurekey in featuresToImport) {
        const listItem = featuresToImport[featurekey]
        try {
            if (listItem.action === FeatureImportAction.Create) {
                await DVC.createFeature(projectKey, listItem.feature)
                createdCount += 1
            } else if (listItem.action === FeatureImportAction.Update) {
                await DVC.updateFeature(projectKey, listItem.feature)
                updatedCount += 1
            } else {
                skippedCount += 1
            }
        } catch (e) {
            featureErrors[listItem.feature.key] = e instanceof Error ? e.message : 'Unknown error'
        }
    }

    return {
        createdCount,
        updatedCount,
        skippedCount,
        errored: featureErrors,
    }
}