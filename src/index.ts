import { getConfigs } from './configs'

import { FeatureSummary } from './resources/features/types'
import { CustomPropertiesImporter, LDFeatureImporter } from './resources/features'
import { LDProjectImporter } from './resources/projects'
import { LDAudienceImporter } from './resources/audiences'
import { LDEnvironmentImporter } from './resources/environments'

const config = getConfigs()

async function run() {
    console.log('Importing project...')
    const projectImporter = new LDProjectImporter(config)
    await projectImporter.import()

    const sourceProject = projectImporter.sourceProject

    console.log('Importing environments...')
    const environmentImporter = new LDEnvironmentImporter(config)
    await environmentImporter.import(sourceProject.environments)

    const ldEnvironments = sourceProject.environments.items
    const environmentKeys = ldEnvironments.map((env: Record<string, any>) => env.key)

    console.log('Importing audiences...')
    const audienceImporter = new LDAudienceImporter(config)
    await audienceImporter.import(environmentKeys)

    console.log('Importing features...')
    const featureImporter = new LDFeatureImporter(config, audienceImporter)
    const featureSummary = await featureImporter.import()

    console.log('Importing custom properties...')
    const customPropertiesImporter = new CustomPropertiesImporter(config)
    await customPropertiesImporter.import(
        featureImporter.featuresToImport,
        Object.values(audienceImporter.audiences)
    )

    printSummary(featureSummary)
}

function printSummary(featureSummary: FeatureSummary) {
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

