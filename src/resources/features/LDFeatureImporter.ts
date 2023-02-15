import { LD, DVC } from '../../api'
import { CustomProperties, Feature as DVCFeature, FeatureConfiguration } from '../../types/DevCycle'
import { Feature as LDFeature } from '../../types/LaunchDarkly'
import { buildTargetingRules, mapLDFeatureToDVCFeature } from '../../utils/LaunchDarkly'
import { ParsedImporterConfig } from '../../configs'
import { CustomPropertyFromFilter, FeatureImportAction, FeaturesToImport } from './types'
import { LDAudienceImporter } from '../audiences'
import { kebabCase, uniqBy } from 'lodash'

export class LDFeatureImporter {
    private config: ParsedImporterConfig
    private audienceImport: LDAudienceImporter

    // Errors by feature key
    errors: Record<string, string> = {}

    // Features to import, by feature key
    featuresToImport: FeaturesToImport

    // List of LD feature flags
    sourceFeatures: LDFeature[]

    // List of custom properties to import
    customPropertiesToImport: CustomPropertyFromFilter[] = []

    constructor(config: ParsedImporterConfig, audienceImport: LDAudienceImporter) {
        this.config = config
        this.audienceImport = audienceImport
    }

    private async getFeaturesToImport(): Promise<FeaturesToImport> {
        const { includeFeatures, excludeFeatures, overwriteDuplicates, projectKey } = this.config

        const existingFeatures = await DVC.getFeaturesForProject(projectKey)
        const { items: ldFeatures } = await LD.getFeatureFlagsForProject(projectKey)

        const featuresToImport: FeaturesToImport = {}

        const existingFeaturesMap = existingFeatures.reduce((map: Record<string, DVCFeature>, feature) => {
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

            featuresToImport[mappedFeature.key] = { feature: mappedFeature, action: FeatureImportAction.Skip }

            if (!includeFeature || excludeFeature) continue

            if (!isDuplicate) {
                featuresToImport[mappedFeature.key].action = FeatureImportAction.Create
            } else if (overwriteDuplicates) {
                featuresToImport[mappedFeature.key].action = FeatureImportAction.Update
            }
        }
        this.featuresToImport = featuresToImport
        this.sourceFeatures = ldFeatures

        return featuresToImport
    }

    private async getFeatureConfigsToImport(): Promise<FeaturesToImport> {
        for (const feature of this.sourceFeatures) {
            const { action, feature: dvcFeature } = this.featuresToImport[feature.key]
            if (action === FeatureImportAction.Skip) continue

            this.featuresToImport[feature.key].configs ??= []

            Object.entries(feature.environments).forEach(([environment, environmentConfig]) => {
                try {
                    if (environmentConfig.prerequisites?.length) {
                        throw new Error(`Unable to import prerequisite in "${environment}" environment`)
                    }
                    const { targetingRules: targets, customPropertiesToImport: newCustomProperties } = buildTargetingRules(feature, environment, this.audienceImport)
                    this.customPropertiesToImport = this.customPropertiesToImport.concat(newCustomProperties)

                    const targetingRules: FeatureConfiguration = {
                        targets,
                        status: environmentConfig.on ? 'active' : 'inactive',
                    }
                    if (targets.length > 0) {
                        this.featuresToImport[dvcFeature.key].configs?.push({
                            environment,
                            targetingRules,
                        })
                    }
                } catch (err) {
                    this.featuresToImport[dvcFeature.key].action = FeatureImportAction.Unsupported
                    const errorMessage = err instanceof Error ? err.message : 'unknown error'
                    this.errors[dvcFeature.key] = errorMessage
                    console.log(`Skipping feature "${dvcFeature.key}":`, errorMessage)
                }
            })
        }
        this.customPropertiesToImport = uniqBy(this.customPropertiesToImport, 'dataKey')
        return this.featuresToImport
    }

    private async importFeatures() {
        const { projectKey } = this.config
        let createdCount = 0
        let updatedCount = 0
        let skippedCount = 0

        for (const featurekey in this.featuresToImport) {
            const { feature, action } = this.featuresToImport[featurekey]
            if (this.errors[feature.key]) continue

            try {
                if (action === FeatureImportAction.Create) {
                    console.log(`Creating feature "${feature.key}" in DevCycle`)
                    await DVC.createFeature(projectKey, feature)
                    createdCount += 1
                } else if (action === FeatureImportAction.Update) {
                    console.log(`Updating feature "${feature.key}" in DevCycle`)
                    await DVC.updateFeature(projectKey, feature)
                    updatedCount += 1
                } else {
                    console.log(`Skipping feature "${feature.key}" creation`)
                    skippedCount += 1
                }
            } catch (e) {
                this.errors[feature.key] = e instanceof Error ? e.message : 'unknown error'
            }
        }

        return {
            createdCount,
            updatedCount,
            skippedCount,
            errored: this.errors,
        }
    }

    private async importFeatureConfigs() {
        const { projectKey, overwriteDuplicates } = this.config
        for (const featureKey in this.featuresToImport) {
            const { action, feature, configs = [] } = this.featuresToImport[featureKey]
            if (this.errors[feature.key]) continue
            if (action === FeatureImportAction.Skip) continue

            for (const config of configs) {
                try {
                    if ((action === FeatureImportAction.Create) ||
                        (action === FeatureImportAction.Update && overwriteDuplicates)) {
                        await DVC.updateFeatureConfigurations(
                            projectKey, feature.key, config.environment, config.targetingRules
                        )
                    }
                } catch (e) {
                    this.errors[feature.key] = e instanceof Error ? e.message : 'unknown error'
                }
            }
        }
    }

    private async importCustomProperties() {
        const { overwriteDuplicates, projectKey } = this.config
        const existingCustomPropertiesMap = await DVC.getCustomPropertiesForProject(projectKey)
            .then((existingCustomProperties) => existingCustomProperties.reduce((map: Record<string, CustomProperties>, cp) => {
                map[cp.propertyKey] = cp
                return map
            }, {}))

        for (const customProperty of this.customPropertiesToImport) {
            const customPropertyToCreate = {
                key: kebabCase(customProperty.dataKey),
                name: customProperty.dataKey,
                type: customProperty.dataKeyType,
                propertyKey: customProperty.dataKey,
            }
            const isDuplicate = existingCustomPropertiesMap[customPropertyToCreate.propertyKey] !== undefined
            try {
                if (!isDuplicate) {
                    await DVC.createCustomProperty(projectKey, customPropertyToCreate)
                } else if (overwriteDuplicates) {
                    await DVC.updateCustomProperty(projectKey, customPropertyToCreate)
                }
            } catch (e) {
                console.log(`Error Importing Custom Property ${customPropertyToCreate.propertyKey} due to: ${e instanceof Error ? e.message : 'unknown error'}`)
            }
        }
    }

    public async import() {
        await this.getFeaturesToImport()
        await this.getFeatureConfigsToImport()
        const { createdCount, updatedCount, skippedCount } = await this.importFeatures()
        await this.importFeatureConfigs()
        await this.importCustomProperties()
        return {
            createdCount,
            updatedCount,
            skippedCount,
            errored: this.errors,
        }
    }
}