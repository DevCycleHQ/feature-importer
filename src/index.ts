import { getConfigs } from './configs'
import { importAudiences } from './resources/audiences'
import { importEnvironments } from './resources/environments'
import { importProject } from './resources/project'

import { LDFeatureImporter } from './resources/features'
import { FeatureSummary } from './resources/features/types'

const config = getConfigs()

async function run() {
    const { ldProject } = await importProject(config)

    const {
        environmentsByKey
    } = await importEnvironments(config, ldProject.environments)

    const ldEnvironments = ldProject.environments.items
    const environmentKeys = ldEnvironments.map((env: Record<string, any>) => env.key)
    const audienceOutput = await importAudiences(config, environmentKeys)

    const featureImporter = new LDFeatureImporter(config, audienceOutput)
    const featureSummary = await featureImporter.import()

    printSumary(featureSummary)
}

function printSumary(featureSummary: FeatureSummary) {
    const {
        createdCount,
        updatedCount,
        skippedCount,
        errored
    } = featureSummary

    console.log('-------------------------------------------')
    console.log(`Created ${createdCount} features in DevCycle`)
    if (updatedCount) console.log(`Updated ${updatedCount} features`)
    if (skippedCount) console.log(`Skipped ${skippedCount} features`)
    if (Object.keys(errored).length) {
        console.log('-------------------------------------------')
        console.error(
            'Failed to import the following features:',
            Object
                .entries(errored)
                .map(([key, error]) => `\n\t- ${key}: ${error}`)
                .join('')
        )
    }
    console.log('-------------------------------------------')
}

run()

