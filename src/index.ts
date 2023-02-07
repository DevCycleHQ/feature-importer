import { getConfigs } from './configs'
import { importProject } from './resources/project'

const config = getConfigs()

async function run() {
    await importProject(config)
}

run()

