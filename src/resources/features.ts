import { LD, DVC } from '../api'
import { Feature } from '../types/DevCycle'
import { mapLDFeatureToDVCFeature } from '../utils/LaunchDarkly'
import { ParsedImporterConfig } from '../configs'

export const importFeatures = async (config: ParsedImporterConfig) => {
    const { includeFeatures, excludeFeatures, overwriteDuplicates, projectKey } = config

    const existingFeatures = await DVC.getFeaturesForProject(projectKey)
    const { items: featuresToImport } = await LD.getFeatureFlagsForProject(projectKey)

    const featuresToCreate: Feature[] = []
    const featuresToUpdate: Feature[] = []
    const featuresToSkip: Feature[] = []
    const featureErrorList: unknown[] = []
    
    const existingFeaturesMap = existingFeatures.reduce((map: { [key: string]: Feature }, feature: Feature) => {
        map[feature.key] = feature
        return map
    }, {})

    for (const feature of featuresToImport) {
        const mappedFeature = mapLDFeatureToDVCFeature(feature)
        const isDuplicate = existingFeaturesMap[mappedFeature.key] !== undefined
        const includeFeature = (includeFeatures && includeFeatures.size > 0) ?
            includeFeatures.get(mappedFeature.key) : 
            true
        const excludeFeature = (excludeFeatures && excludeFeatures.size > 0) ?
            excludeFeatures.get(mappedFeature.key) :
            false

        if (!includeFeature || excludeFeature) {
            featuresToSkip.push(mappedFeature)
            continue
        }
        if (!isDuplicate) {
            featuresToCreate.push(mappedFeature)
        } else if (overwriteDuplicates) {
            featuresToUpdate.push(mappedFeature)
        } else {
            featuresToSkip.push(mappedFeature)
        }
    }

    let createdCount = 0
    let updatedCount = 0

    for (const feature of featuresToCreate) {
        try {
            await DVC.createFeature(projectKey, feature)
            createdCount += 1
        } catch (e) {
            featureErrorList.push(e)
        }
    }

    for (const feature of featuresToUpdate) {
        try {
            await DVC.updateFeature(projectKey, feature)
            updatedCount += 1
        } catch (e) {
            featureErrorList.push(e)
        }
    }

    return {
        createdCount,
        updatedCount,
        skipped: featuresToSkip,
        errored: featureErrorList,
    }
}
