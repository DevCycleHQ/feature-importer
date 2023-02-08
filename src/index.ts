import { getConfigs } from './configs'
import { importAudiences } from './resources/audiences'
import { importEnvironments } from './resources/environments'
import { importProject } from './resources/project'
import { importFeatures } from './resources/features'

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

    const importFeaturesResult = await importFeatures(config)
    console.log(`Created ${importFeaturesResult.createdCount} features`)
    console.log(`Updated ${importFeaturesResult.updatedCount} features`)
    console.log(`Skipped the following ${importFeaturesResult.skipped.length} features: `,
        JSON.stringify(importFeaturesResult.skipped))
    console.log(`Failed to import the following ${importFeaturesResult.errored.length} features: `,
        JSON.stringify(importFeaturesResult.errored))
}
run()

