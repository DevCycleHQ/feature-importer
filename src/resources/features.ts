import { getConfigs } from '../configs'
import { LD, DVC } from '../api'
import { LDFeature } from '../types/LaunchDarkly'
import { Feature } from '../types/DevCycle'
import { mapLDFeatureToDVCFeature } from '../utils/LaunchDarkly/utils'

const config = getConfigs()

export const importFeatures = async () => {
    const { includeFeatures, excludeFeatures, overwriteDuplicates, projectKey } = config

    const existingFeatures = await DVC.getFeaturesForProject(projectKey)
    let { items: featuresToImport } = await LD.getFeatureFlagsForProject(projectKey)

    let featuresToCreate: Feature[] = []
    let featuresToUpdate: Feature[] = []
    const featuresToSkip: Feature[] = []

    const featureErrorList: Feature[] = []

    if (includeFeatures !== undefined && includeFeatures.length > 0) {
        featuresToImport = featuresToImport.filter((feature: LDFeature) => includeFeatures.includes(feature.key))
    }

    featuresToImport.filter((feature: LDFeature) => {
        const mappedFeature = mapLDFeatureToDVCFeature(feature)
        if (existingFeatures.find((existingFeature: Feature) => existingFeature.key === feature.key)) {
            if (overwriteDuplicates) {
                featuresToUpdate.push(mappedFeature)
            } else {
                featuresToSkip.push(mappedFeature)
            }
        } else {
            featuresToCreate.push(mappedFeature)
        }
    })

    if (excludeFeatures !== undefined && excludeFeatures.length > 0) {
        featuresToCreate = featuresToCreate.filter((feature) => !excludeFeatures.includes(feature.key))
        featuresToUpdate = featuresToUpdate.filter((feature) => !excludeFeatures.includes(feature.key))
    }

    let createdCount = 0
    let updatedCount = 0

    for (let feature of featuresToCreate) {
        const response = await DVC.createFeature(projectKey, feature)
        if (response?.statusCode) {
            featureErrorList.push(response)
        } else {
            createdCount += 1
        }
    }

    for (let feature of featuresToUpdate) {
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
