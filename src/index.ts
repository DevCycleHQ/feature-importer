import { getConfigs } from './configs'
import { importAudiences } from './resources/audiences'
import { importEnvironments } from './resources/environments'
import { importProject } from './resources/project'
import { prepareFeaturesToImport, importFeatures } from './resources/features'
import { importFeatureConfigs, prepareFeatureConfigsToImport } from './resources/targetingRules'

const config = getConfigs()

async function run() {
    const { ldProject } = await importProject(config)

    const {
        environmentsByKey
    } = await importEnvironments(config, ldProject.environments)

    const ldEnvironments = ldProject.environments.items
    const environmentKeys = ldEnvironments.map((env: Record<string, any>) => env.key)
    const {
        audiencesByKey,
        unsupportedAudiencesByKey
    } = await importAudiences(config, environmentKeys)

    const { featuresToImport, ldFeatures } = await prepareFeaturesToImport(config)

    const featuresAndConfigurationsToImport =
        await prepareFeatureConfigsToImport(featuresToImport, ldFeatures)

    console.log('Summary: ')
    const importFeaturesResult = await importFeatures(config, featuresAndConfigurationsToImport)
    console.log(`Created ${importFeaturesResult.createdCount} features`)
    console.log(`Updated ${importFeaturesResult.updatedCount} features`)
    console.log(`Failed to import the following ${importFeaturesResult.errored.length} features: `,
        JSON.stringify(importFeaturesResult.errored))
    console.log(`Skipped ${importFeaturesResult.skippedCount} features: `,
        (importFeaturesResult.skipped))

    const createTargetingRulesResult = await importFeatureConfigs(config, featuresAndConfigurationsToImport)

    console.log(`Created ${createTargetingRulesResult.count} targeting rules`)
    console.log(`Failed to import the following ${createTargetingRulesResult.errorList.length} features configs: `,
        JSON.stringify(createTargetingRulesResult.errorList))

    // const unsupportedFeatures = Object.entries(featuresAndConfigurationsToImport).filter(([featureKey, feature]) => {
    //     return feature.action === 'unsupported'
    // })
    // console.log(`Skipped ${unsupportedFeatures.length} features due to unsupported targeting rules: `,
    //     JSON.stringify(unsupportedFeatures))

}
run()

