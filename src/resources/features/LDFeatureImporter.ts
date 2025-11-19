import { LD, DVC } from '../../api'
import {
    Feature as DVCFeature,
    FeatureConfiguration,
} from '../../types/DevCycle'
import {
    Feature as LDFeature,
} from '../../types/LaunchDarkly'
import {
    buildTargetingRules,
    mapLDFeatureToDVCFeature,
} from '../../utils/LaunchDarkly'
import { ParsedImporterConfig } from '../../configs'
import { FeatureImportAction, FeaturesToImport } from './types'
import { LDAudienceImporter } from '../audiences'
import { formatKey } from '../../utils/DevCycle'

export class LDFeatureImporter {
    private config: ParsedImporterConfig
    private audienceImport: LDAudienceImporter

    // Errors by feature key
    errors: Record<string, string> = {}

    // Features to import, by feature key
    featuresToImport: FeaturesToImport

    // List of LD feature flags
    sourceFeatures: LDFeature[]

    constructor(
        config: ParsedImporterConfig,
        audienceImport: LDAudienceImporter,
    ) {
        this.config = config
        this.audienceImport = audienceImport
    }

    /**
     * Helper method to add a delay between API calls to avoid rate limiting
     */
    private delay(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms))
    }

    private async getFeaturesToImport(): Promise<FeaturesToImport> {
        const {
            includeFeatures,
            excludeFeatures,
            overwriteDuplicates,
            sourceProjectKey,
            targetProjectKey,
        } = this.config

        const existingFeatures = await DVC.getFeaturesForProject(targetProjectKey)
        const { items: ldFeatures } = await LD.getFeatureFlagsForProject(
            sourceProjectKey
        )

        const featuresToImport: FeaturesToImport = {}

        const existingFeaturesMap = existingFeatures.reduce(
            (map: Record<string, DVCFeature>, feature) => {
                map[feature.key] = feature
                return map
            },
            {}
        )

        for (const feature of ldFeatures) {
            const mappedFeature = mapLDFeatureToDVCFeature(feature)
            const isDuplicate = existingFeaturesMap[mappedFeature.key] !== undefined
            const includeFeature =
        includeFeatures && includeFeatures.size > 0
            ? includeFeatures.get(mappedFeature.key)
            : true
            const excludeFeature =
        excludeFeatures && excludeFeatures.size > 0
            ? excludeFeatures.get(mappedFeature.key)
            : false

            featuresToImport[mappedFeature.key] = {
                feature: mappedFeature,
                action: FeatureImportAction.Skip,
            }

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
        const { operationMap } = this.config
        for (const feature of this.sourceFeatures) {
            const featureKey = formatKey(feature.key)
            const { action, feature: dvcFeature } = this.featuresToImport[featureKey]
            if (action === FeatureImportAction.Skip) continue

            this.featuresToImport[featureKey].configs ??= []

            if (!feature.environments) {
                throw new Error(
                    `Feature "${feature.key}" is missing environments, this is likely due to an API version mismatch.`
                     + ' Please use API version 20220603 when creating the API access token.'
                )
            }

            Object.entries(feature.environments).forEach(
                ([environment, environmentConfig]) => {
                    try {
                        if (environmentConfig.prerequisites?.length) {
                            throw new Error(
                                `Unable to import prerequisite in "${environment}" environment`
                            )
                        }
                        const targets = buildTargetingRules(
                            feature,
                            environment,
                            this.audienceImport,
                            operationMap
                        )

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
                        this.featuresToImport[dvcFeature.key].action =
              FeatureImportAction.Unsupported
                        const errorMessage =
              err instanceof Error ? err.message : 'unknown error'
                        this.errors[dvcFeature.key] = errorMessage
                        console.log(`Skipping feature "${dvcFeature.key}":`, errorMessage)
                    }
                }
            )
        }
        return this.featuresToImport
    }

    private async importFeatures() {
        const { targetProjectKey } = this.config
        let createdCount = 0
        let updatedCount = 0
        let skippedCount = 0

        for (const featurekey in this.featuresToImport) {
            const { feature, action, configs=[] } = this.featuresToImport[featurekey]
            if (this.errors[feature.key]) continue
            const configurations: Record<string, FeatureConfiguration> = {}
            configs.forEach((config) => {
                configurations[config.environment] = config.targetingRules
            })

            try {
                if (action === FeatureImportAction.Create) {
                    console.log(`Creating feature "${feature.key}" in DevCycle`)
                    await DVC.createFeature(targetProjectKey, feature, configurations)
                    createdCount += 1
                } else if (action === FeatureImportAction.Update) {
                    console.log(`Updating feature "${feature.key}" in DevCycle`)
                    await DVC.updateFeature(targetProjectKey, feature, configurations)
                    updatedCount += 1
                } else {
                    console.log(`Skipping feature "${feature.key}" creation`)
                    skippedCount += 1
                }
            } catch (e) {
                this.errors[feature.key] =
          e instanceof Error ? e.message : 'unknown error'
            }
            await this.delay(250) // 250ms delay
        }

        return {
            createdCount,
            updatedCount,
            skippedCount,
            errored: this.errors,
        }
    }

    public async import() {
        await this.getFeaturesToImport()
        await this.getFeatureConfigsToImport()
        const { createdCount, updatedCount, skippedCount } =
      await this.importFeatures()
        return {
            createdCount,
            updatedCount,
            skippedCount,
            errored: this.errors,
        }
    }
}
