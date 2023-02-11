import { LD, DVC } from '../api'
import {
    Feature as DVCFeature, FeatureConfiguration
} from '../types/DevCycle'
import { Feature as LDFeature } from '../types/LaunchDarkly'
import { ParsedImporterConfig } from '../configs'
import { mapLDTargetToDVCTarget } from '../utils/LaunchDarkly/targeting'
import { FeaturesToImport } from '../types'

export const prepareFeatureConfigsToImport = async (
    featuresToImport: FeaturesToImport,
    ldFeatureFlags: LDFeature[]
) => {
    for (const feature of ldFeatureFlags) {
        if (featuresToImport[feature.key].action === 'skip') {
            continue
        }
        featuresToImport[feature.key].configs ??= []
        const matchingDVCFeature: DVCFeature = featuresToImport[feature.key].feature

        Object.entries(feature.environments).forEach(([environment, environmentConfig]) => {
            const environmentTargetingRules: FeatureConfiguration = {
                targets: [],
                status: environmentConfig.on ? 'active' : 'inactive',
            }
            let dvcTargets
            try {
                dvcTargets = mapLDTargetToDVCTarget(feature, environment)
                environmentTargetingRules.targets.push(...dvcTargets)
                if (environmentTargetingRules.targets.length !== 0) {
                    featuresToImport[matchingDVCFeature.key].configs?.push({
                        environment,
                        targetingRules: environmentTargetingRules,
                    })
                }
            } catch (err) {
                featuresToImport[matchingDVCFeature.key].action = 'unsupported'
                const errorMessage = err instanceof Error ? 'due to ' + err.message : ''
                console.log('Skipping feature', matchingDVCFeature.key, 'due to', errorMessage)
            }
        })
    }
    return featuresToImport
}

export const importFeatureConfigs = async (
    config: ParsedImporterConfig,
    featureConfigurationsToImport: FeaturesToImport
) => {
    const errorList = []
    const { projectKey } = config
    let count = 0
    for (const featureKey in featureConfigurationsToImport) {
        if (featureConfigurationsToImport[featureKey].action === 'skip') {
            continue
        }
        const { feature, configs = [] } = featureConfigurationsToImport[featureKey]
        for (const config of configs) {
            try {
                DVC.updateFeatureConfigurations(
                    projectKey, feature.key, config.environment, config.targetingRules
                )
                count++
            } catch (e) {
                errorList.push(e)
            }
        }
    }
    return { count, errorList }
}