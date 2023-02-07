import { getConfigs } from './configs'
import { importAudiences } from './resources/audiences'
import { importProject } from './resources/project'

const config = getConfigs()

async function run() {
    const { ldProject } = await importProject(config)

    const ldEnvironments = ldProject.environments.items
    const environmentKeys = ldEnvironments.map((env: Record<string, any>) => env.key)
    const {
        audiencesByKey,
        unsupportedAudiencesByKey
    } = await importAudiences(config, environmentKeys)
}
run()

