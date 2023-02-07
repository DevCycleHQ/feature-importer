import { getConfigs } from './configs'
import { importAudiences } from './resources/audiences'
import { importProject } from './resources/project'
import { importFeatures } from './resources/features'

const config = getConfigs()

async function run() {
    const { ldProject } = await importProject(config)
    importFeatures().then((result) => console.log(result))

    const ldEnvironments = ldProject.environments.items
    const environmentKeys = ldEnvironments.map((env: Record<string, any>) => env.key)
    const {
        audiencesByKey,
        unsupportedAudiencesByKey
    } = await importAudiences(config, environmentKeys)
}
run()

