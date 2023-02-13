import { DVC } from '../api'
import {
    FeatureConfiguration, OperatorType, TargetingRule
} from '../types/DevCycle'
import { Feature as LDFeature } from '../types/LaunchDarkly'
import { ParsedImporterConfig } from '../configs'
import { FeaturesToImport } from '../types'
import { getComparator, getVariationKey, mapClauseToFilter } from '../utils/LaunchDarkly'
import { createAudienceMatchFilter, createUserFilter } from '../utils/DevCycle'
import { AudienceOutput } from './audiences'

export const prepareFeatureConfigsToImport = async (
    featuresToImport: FeaturesToImport,
    ldFeatureFlags: LDFeature[],
    audiences: AudienceOutput
) => {
    for (const feature of ldFeatureFlags) {
        const { action, feature: dvcFeature } = featuresToImport[feature.key]
        if (action === 'skip') continue

        featuresToImport[feature.key].configs ??= []

        Object.entries(feature.environments).forEach(([environment, environmentConfig]) => {
            try {
                const targets = buildTargetingRules(feature, environment, audiences)
                const targetingRules: FeatureConfiguration = {
                    targets,
                    status: environmentConfig.on ? 'active' : 'inactive',
                }
                if (targets.length > 0) {
                    featuresToImport[dvcFeature.key].configs?.push({
                        environment,
                        targetingRules,
                    })
                }
            } catch (err) {
                featuresToImport[dvcFeature.key].action = 'unsupported'
                const errorMessage = err instanceof Error ? err.message : 'unknown error'
                console.log(`Skipping feature "${dvcFeature.key}":`, errorMessage)
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
        const { action, feature, configs = [] } = featureConfigurationsToImport[featureKey]
        if (action === 'skip') continue

        for (const config of configs) {
            try {
                await DVC.updateFeatureConfigurations(
                    projectKey, feature.key, config.environment, config.targetingRules
                )
                count++
            } catch (e) {
                console.log(e)
                errorList.push(e)
            }
        }
    }
    return { count, errorList }
}

const buildTargetingRules = (
    feature: LDFeature,
    environmentKey: string,
    audiences: AudienceOutput
): TargetingRule[] => {
    const targetingRules: TargetingRule[] = []
    const { targets, rules } = feature.environments[environmentKey]

    for (const target of targets) {
        const audience = {
            name: 'imported-target',
            filters: {
                filters: [createUserFilter('user_id', '=', target.values)],
                operator: OperatorType.and
            }
        }
        const distribution = [{
            _variation: getVariationKey(feature, target.variation),
            percentage: 1
        }]

        targetingRules.push({ audience, distribution })
    }

    for (const rule of rules) {
        const filters = rule.clauses.map((clause) => {
            if (clause.op === 'segmentMatch') {
                const audienceIds = clause.values.map((segKey) => {
                    const audienceKey = `${segKey}-${environmentKey}`
                    if (audiences.errorsByKey[audienceKey] || !audiences.audiencesByKey[audienceKey]) {
                        const errorMessage = audiences.errorsByKey[audienceKey] || 'unknown error'
                        throw new Error(errorMessage)
                    } else {
                        return audiences.audiencesByKey[audienceKey]._id
                    }
                })
                return createAudienceMatchFilter(
                    getComparator(clause),
                    audienceIds
                )
            }
            return mapClauseToFilter(clause)
        })
        const audience = {
            name: 'imported-rule',
            filters: {
                filters,
                operator: OperatorType.and
            }
        }
        const distribution = [{
            _variation: getVariationKey(feature, rule.variation),
            percentage: 1
        }]
        targetingRules.push({
            audience,
            distribution
        })
    }

    return targetingRules
}