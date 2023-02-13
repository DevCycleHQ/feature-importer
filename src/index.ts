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

    const {
        createdCount,
        updatedCount,
        skippedCount,
        errored: erroredFeatures
    } = await importFeatures(config, featuresAndConfigurationsToImport)
    await importFeatureConfigs(config, featuresAndConfigurationsToImport)

    console.log('-------------------------------------------')
    console.log(`Created ${createdCount} features in DevCycle`)
    if (updatedCount) console.log(`Updated ${updatedCount} features`)
    if (skippedCount) console.log(`Skipped ${skippedCount} features`)
    if (Object.keys(erroredFeatures).length) {
        console.error(
            'Failed to import the following features:',
            Object
                .entries(erroredFeatures)
                .map(([key, error]) => `\n\t- ${key}: ${error}`)
                .join('')
        )
    }
    console.log('-------------------------------------------')
}

run()

