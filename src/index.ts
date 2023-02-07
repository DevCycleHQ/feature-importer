import { getConfigs } from './configs'
import { LD, DVC } from './api'

const config = getConfigs()

async function populateProject() {
    const ldProject = await LD.getProject(config.projectKey)
    const dvcProject = await DVC.getProject(config.projectKey)

    const isDuplicate = Boolean(dvcProject._id)

    const projectPayload = {
        name: ldProject.name,
        key: ldProject.key
    }

    let response
    if (!isDuplicate) {
        response = await DVC.createProject(projectPayload)
        console.log(`Creating project "${projectPayload.key}" in DevCycle`)
    } else if (config.overwriteDuplicates) {
        response = await DVC.updateProject(config.projectKey, projectPayload)
        console.log(`Updating project "${config.projectKey}" in DevCycle`)
    } else {
        console.log('Skipping project creation because it already exists')
    }

    if (response?.statusCode) {
        console.log(response)
        throw new Error('Error creating project')
    }

    return {
        dvcProject: response,
        ldProject
    }
}

async function run() {
    await populateProject()
}

run()

