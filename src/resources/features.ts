import { LD, DVC } from '../api'
import { LDFeature } from '../types/LaunchDarkly'
import { Feature } from '../types/DevCycle'
import { mapLDFeatureToDVCFeature } from '../utils/LaunchDarkly/utils'
import { DVCImporterConfigs } from '../configs'

export const importFeatures = async (config: DVCImporterConfigs) => {
    const { includeFeatures, excludeFeatures, overwriteDuplicates, projectKey } = config

    const existingFeatures = await DVC.getFeaturesForProject(projectKey)
    let { items: featuresToImport } = await LD.getFeatureFlagsForProject(projectKey)

    const featuresToCreate: Feature[] = []
    const featuresToUpdate: Feature[] = []
    const featuresToSkip: Feature[] = []
    const featureErrorList: Feature[] = []
    
    const existingFeaturesMap: { [key: string]: Feature } = {}
    existingFeatures.forEach((feature: Feature) => {
        existingFeaturesMap[feature.key] = feature
    })

    if (includeFeatures !== undefined && includeFeatures.length > 0) {
        featuresToImport = featuresToImport.filter((feature: LDFeature) => includeFeatures.includes(feature.key))
    }

    for (const feature of featuresToImport) {
        const mappedFeature = mapLDFeatureToDVCFeature(feature)
        const isDuplicate = existingFeaturesMap[mappedFeature.key] !== undefined
        const excludeFeature = excludeFeatures !== undefined && excludeFeatures.length > 0

        if (!isDuplicate && !excludeFeature) {
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
        const response = await DVC.createFeature(projectKey, feature)
        if (response?.statusCode) {
            featureErrorList.push(response)
        } else {
            createdCount += 1
        }
    }

    for (const feature of featuresToUpdate) {
        const response = await DVC.updateFeature(projectKey, feature)
        if (response?.statusCode) {
            featureErrorList.push(response)
        } else {
            updatedCount += 1
        }
    }

    return {
        createdCount,
        updatedCount,
        skipped: featuresToSkip,
        errored: featureErrorList,
    }
}
